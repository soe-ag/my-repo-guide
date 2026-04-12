'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { RepoInput } from '@/components/repo-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GitBranch, Clock, ExternalLink, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteAnalysisDialog } from '@/components/delete-analysis-dialog'
import type { Id } from '@/convex/_generated/dataModel'
import { OPENROUTER_MODELS } from '@/lib/prompts'

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'done' ? 'default' : status === 'error' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

function RepoList() {
  const repos = useQuery(api.repos.listInProgress)

  if (repos === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No analyses currently in progress.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {repos.map((repo) => (
        <Link key={repo._id} href={`/repo/${repo._id}`}>
          <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="font-medium">
                    {repo.owner}/{repo.name}
                  </p>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    {new Date(repo.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={repo.status} />
                <ExternalLink className="text-muted-foreground h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function getModelName(modelId: string): string {
  return OPENROUTER_MODELS.find((model) => model.id === modelId)?.name ?? modelId
}

function SavedAnalysesList() {
  const savedAnalyses = useQuery(api.savedAnalyses.list)
  const removeAnalysis = useMutation(api.savedAnalyses.remove)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<'savedAnalyses'>
    name: string
  } | null>(null)

  async function handleDelete() {
    if (!deleteTarget) return
    await removeAnalysis({ id: deleteTarget.id })
    toast.success('Analysis deleted')
    setDeleteTarget(null)
  }

  if (savedAnalyses === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (savedAnalyses.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No saved analyses yet. Complete an analysis to see it here.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {savedAnalyses.map((sa, index) => (
          <div key={sa._id} className="group relative">
            <Link href={`/analysis/${sa.slug}`}>
              <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground w-7 text-xs font-medium">
                      #{index + 1}
                    </div>
                    <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {sa.owner}/{sa.name}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(sa.createdAt).toLocaleString()}
                        <span className="text-muted-foreground/60">&middot;</span>
                        <span>{getModelName(sa.model)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={sa.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={(e) => {
                e.preventDefault()
                setDeleteTarget({ id: sa._id, name: `${sa.owner}/${sa.name}` })
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <DeleteAnalysisDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDelete}
          repoName={deleteTarget.name}
        />
      )}
    </>
  )
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">RepoGuide</h1>
          <p className="text-muted-foreground text-lg">
            Analyze any GitHub repo and generate a comprehensive learning guide with AI.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analyze a Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <RepoInput />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Saved Analyses</h2>
          <SavedAnalysesList />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">In Progress</h2>
          <RepoList />
        </div>
      </main>
    </div>
  )
}
