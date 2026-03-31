'use client'

import { useQuery, useAction, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { AnalysisProgress } from '@/components/analysis-progress'
import { AnalysisTabs } from '@/components/analysis-tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OPENROUTER_MODELS } from '@/lib/prompts'
import type { AnalysisType } from '@/lib/prompts'
import { ArrowLeft, Download, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RepoPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const repoId = params.id as Id<'repos'>
  const initialModel = searchParams.get('model') || OPENROUTER_MODELS[0].id
  const [reAnalyzeModel, setReAnalyzeModel] = useState(initialModel)
  const [copied, setCopied] = useState(false)

  const repo = useQuery(api.repos.get, { repoId })
  const analyses = useQuery(api.analyses.getByRepo, { repoId })
  const latestSaved = useQuery(
    api.savedAnalyses.getLatestByRepo,
    repo ? { owner: repo.owner, name: repo.name } : 'skip'
  )

  const fetchRepo = useAction(api.github.fetchRepo)
  const analyzeRepo = useAction(api.analyze.analyzeRepo)
  const deleteAnalyses = useMutation(api.analyses.deleteByRepo)
  const updateStatus = useMutation(api.repos.updateStatus)

  const hasStartedRef = useRef(false)

  const startPipeline = useCallback(
    async (model: string) => {
      if (!repo) return

      try {
        // Fetch from GitHub
        const result = await fetchRepo({
          repoId,
          owner: repo.owner,
          name: repo.name,
        })

        if (result.success) {
          // Start analysis
          await analyzeRepo({ repoId, model })
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Pipeline failed')
      }
    },
    [repo, repoId, fetchRepo, analyzeRepo]
  )

  // Auto-start pipeline for new repos
  useEffect(() => {
    if (repo && repo.status === 'fetching' && !hasStartedRef.current) {
      hasStartedRef.current = true
      startPipeline(initialModel)
    }
  }, [repo, initialModel, startPipeline])

  // Auto-redirect to saved analysis page when done
  useEffect(() => {
    if (repo?.status === 'done' && latestSaved?.slug) {
      router.replace(`/analysis/${latestSaved.slug}`)
    }
  }, [repo?.status, latestSaved?.slug, router])

  async function handleReAnalyze() {
    if (!repo) return
    await deleteAnalyses({ repoId })
    await updateStatus({ repoId, status: 'analyzing' })
    try {
      await analyzeRepo({ repoId, model: reAnalyzeModel })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Re-analysis failed')
    }
  }

  function buildMarkdownExport(): string {
    if (!analyses || !repo) return ''
    const lines = [
      `# RepoGuide Analysis: ${repo.owner}/${repo.name}`,
      `> ${repo.repoUrl}`,
      `> Generated on ${new Date().toLocaleDateString()}`,
      '',
    ]
    const order: AnalysisType[] = [
      'techStack',
      'structure',
      'architecture',
      'routes',
      'dataModel',
      'patterns',
      'learningPath',
    ]
    for (const type of order) {
      const analysis = analyses.find((a) => a.type === type)
      if (analysis) {
        lines.push(`---\n`)
        lines.push(analysis.content)
        lines.push('')
      }
    }
    return lines.join('\n')
  }

  function handleExport() {
    const md = buildMarkdownExport()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repo?.owner}-${repo?.name}-analysis.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown file downloaded!')
  }

  function handleCopy() {
    const md = buildMarkdownExport()
    navigator.clipboard.writeText(md)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (repo === undefined) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (repo === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Repository not found.</p>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  const completedTypes: AnalysisType[] = analyses?.map((a) => a.type as AnalysisType) || []
  const isProcessing = repo.status === 'fetching' || repo.status === 'analyzing'
  const isDone = repo.status === 'done'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {repo.owner}/{repo.name}
            </h1>
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
            >
              {repo.repoUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {isDone && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 h-4 w-4" />
              Export .md
            </Button>
          </div>
        )}
      </div>

      {/* Progress */}
      {isProcessing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisProgress
              completedTypes={completedTypes}
              status={repo.status}
              errorMessage={repo.errorMessage}
            />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {repo.status === 'error' && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">
              {repo.errorMessage || 'An error occurred during analysis.'}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleReAnalyze}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Re-analyze controls */}
      {isDone && (
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <span className="text-sm font-medium">Re-analyze with:</span>
            <Select value={reAnalyzeModel} onValueChange={setReAnalyzeModel}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENROUTER_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleReAnalyze}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Re-analyze
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analyses && analyses.length > 0 && <AnalysisTabs analyses={analyses} />}
    </div>
  )
}
