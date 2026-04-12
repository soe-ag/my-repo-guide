'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { RepoInput } from '@/components/repo-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GitBranch, Clock, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteAnalysisDialog } from '@/components/delete-analysis-dialog'
import type { Id } from '@/convex/_generated/dataModel'
import { OPENROUTER_MODELS } from '@/lib/prompts'
import Image from 'next/image'

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'done' ? 'default' : status === 'error' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

function RepoList() {
  const repos = useQuery(api.repos.listInProgress)
  const removeRepo = useMutation(api.repos.remove)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<'repos'>
    name: string
  } | null>(null)

  async function handleDelete() {
    if (!deleteTarget) return
    await removeRepo({ repoId: deleteTarget.id })
    toast.success('In-progress analysis deleted')
    setDeleteTarget(null)
  }

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
    <>
      <div className="space-y-3">
        {repos.map((repo) => (
          <Card key={repo._id} className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <GitBranch className="text-muted-foreground h-5 w-5" />
                <div>
                  <Link
                    href={`/repo/${repo._id}`}
                    className="font-medium hover:underline cursor-pointer"
                  >
                    {repo.owner}/{repo.name}
                  </Link>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    {new Date(repo.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={repo.status} />
                <Link
                  href={`/repo/${repo._id}`}
                  className="text-muted-foreground hover:text-foreground inline-flex"
                  aria-label={`Open ${repo.owner}/${repo.name} progress`}
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteTarget({ id: repo._id, name: `${repo.owner}/${repo.name}` })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground w-14">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Model</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedAnalyses.map((sa, index) => (
              <tr key={sa._id} className="border-t hover:bg-accent/30 transition-colors">
                <td className="px-4 py-1 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-1">
                  <Link
                    href={`/analysis/${sa.slug}`}
                    className="font-medium hover:underline cursor-pointer"
                  >
                    {sa.owner}/{sa.name}
                  </Link>
                </td>
                <td className="px-4 py-1 text-muted-foreground">{getModelName(sa.model)}</td>
                <td className="px-4 py-1 text-muted-foreground">
                  {new Date(sa.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-1">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={sa.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground inline-flex"
                      aria-label={`Open ${sa.owner}/${sa.name} repository`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:cursor-pointer"
                      onClick={() => {
                        setDeleteTarget({ id: sa._id, name: `${sa.owner}/${sa.name}` })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      <main className="flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-2xl border shadow-sm">
          <Image
            src="/images/repoguide1.png"
            alt="RepoGuide hero illustration"
            width={1366}
            height={768}
            priority
            className="h-56 w-full object-cover sm:h-72"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent" />
        </div>

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
