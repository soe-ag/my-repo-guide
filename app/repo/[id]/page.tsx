'use client'

import { useQuery, useAction, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { AnalysisProgress } from '@/components/analysis-progress'
import { AnalysisTabs } from '@/components/analysis-tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OPENROUTER_MODELS, FREE_MODELS_ROUTER_ID, FREE_DAILY_LIMIT } from '@/lib/prompts'
import type { AnalysisType } from '@/lib/prompts'
import { ArrowLeft, Download, ExternalLink, RefreshCw, Copy, Check, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(value: number) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function RepoPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const repoId = params.id as Id<'repos'>
  const initialModel = searchParams.get('model') || FREE_MODELS_ROUTER_ID
  const [reAnalyzeModel, setReAnalyzeModel] = useState(initialModel)
  const [copied, setCopied] = useState(false)

  const repo = useQuery(api.repos.get, { repoId })
  const analyses = useQuery(api.analyses.getByRepo, { repoId })
  const latestSaved = useQuery(
    api.savedAnalyses.getLatestByRepo,
    repo ? { owner: repo.owner, name: repo.name } : 'skip'
  )
  const todayFreeCount = useQuery(api.freeUsage.getTodayCount)

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
    for (const analysis of analyses) {
      lines.push('---\n')
      lines.push(analysis.content)
      lines.push('')
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
      <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    )
  }

  if (repo === null) {
    return (
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-4 border-t border-black pt-6">
          <p className="editorial-kicker text-muted-foreground">Missing file</p>
          <h1 className="font-display text-4xl leading-none tracking-[-0.04em]">
            Repository not found.
          </h1>
        </div>
        <Link href="/">
          <Button variant="ghost" className="mt-6">
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
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="grid gap-8 border-b border-black pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="space-y-5">
          <Link href="/" className="inline-flex">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          </Link>

          <div className="space-y-4">
            <p className="editorial-kicker text-muted-foreground">Repository analysis</p>
            <h1 className="font-display text-[3rem] leading-[1.02] tracking-[-0.05em] sm:text-[4.4rem] lg:max-w-[12ch]">
              {repo.owner}/{repo.name}
            </h1>
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-link inline-flex items-center gap-2 font-ui text-sm font-semibold uppercase tracking-[0.14em] text-foreground"
            >
              Open repository
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid gap-4 border-t border-black pt-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="editorial-kicker text-muted-foreground">Status</p>
              <p className="font-ui text-base font-semibold uppercase tracking-[0.08em]">
                {repo.status}
              </p>
            </div>
            <div className="space-y-1">
              <p className="editorial-kicker text-muted-foreground">Opened</p>
              <p className="font-ui text-base font-semibold">{formatDate(repo.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="editorial-kicker text-muted-foreground">Saved sections</p>
              <p className="font-ui text-base font-semibold">{completedTypes.length}/2 filed</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden border border-black">
            <Image
              src="/images/repoguide2.png"
              alt="Repository analysis illustration"
              width={1366}
              height={768}
              priority
              className="h-60 w-full object-cover"
            />
          </div>

          {isDone && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export .md
              </Button>
            </div>
          )}
        </div>
      </section>

      {isProcessing && (
        <section className="space-y-5 border-b border-black py-8">
          <div className="space-y-3">
            <span className="editorial-ribbon">Analysis Progress</span>
            <p className="max-w-3xl font-body text-[1.03rem] leading-8 text-muted-foreground">
              The pipeline fetches repository contents first, then runs the orientation and
              deep-dive passes in order.
            </p>
          </div>

          <div className="max-w-4xl">
            <AnalysisProgress
              completedTypes={completedTypes}
              status={repo.status}
              errorMessage={repo.errorMessage}
            />
          </div>
        </section>
      )}

      {repo.status === 'error' && (
        <section className="space-y-4 border-b border-black py-8">
          <span className="editorial-ribbon">Pipeline Stopped</span>
          <p className="max-w-3xl border-l-2 border-black pl-4 font-body text-base leading-7 text-foreground">
            {repo.errorMessage || 'An error occurred during analysis.'}
          </p>
          <Button variant="outline" size="sm" onClick={handleReAnalyze}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Retry
          </Button>
        </section>
      )}

      {isDone && (
        <section className="grid gap-6 border-b border-black py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <span className="editorial-ribbon">Re-run</span>
            <p className="max-w-3xl font-body text-[1.03rem] leading-8 text-muted-foreground">
              Send the repository back through the desk with a different model route.
            </p>
            <div className="max-w-md space-y-2">
              <Select value={reAnalyzeModel} onValueChange={setReAnalyzeModel}>
                <SelectTrigger className="w-full">
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

              {reAnalyzeModel === FREE_MODELS_ROUTER_ID && (
                <span className="flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  {todayFreeCount ?? '…'}/{FREE_DAILY_LIMIT} free requests used today
                </span>
              )}
            </div>
          </div>

          <div>
            <Button variant="outline" size="sm" onClick={handleReAnalyze}>
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </Button>
          </div>
        </section>
      )}

      {analyses && analyses.length > 0 && (
        <section className="py-8">
          <div className="mb-6 space-y-3">
            <span className="editorial-ribbon">Analysis Drafts</span>
            <p className="max-w-3xl font-body text-[1.03rem] leading-8 text-muted-foreground">
              Read the generated sections inline while the saved article version is being filed.
            </p>
          </div>
          <AnalysisTabs analyses={analyses} />
        </section>
      )}
    </div>
  )
}
