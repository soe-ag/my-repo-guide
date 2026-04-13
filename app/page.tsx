'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { RepoInput } from '@/components/repo-input'
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

function formatDate(value: number, withTime = false) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(value))
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'done' ? 'default' : status === 'error' ? 'outline' : 'secondary'
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
      <div className="border-y border-black">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full border-t border-black first:border-t-0" />
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
      <div className="border-y border-black">
        {repos.map((repo) => (
          <article
            key={repo._id}
            className="grid gap-4 border-t border-black px-0 py-4 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="hidden pt-1 sm:block">
                <GitBranch className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="editorial-kicker text-muted-foreground">Live pipeline</p>
                <Link
                  href={`/repo/${repo._id}`}
                  className="font-display text-[1.9rem] leading-[1.05] tracking-[-0.04em] text-foreground transition-colors hover:text-link"
                >
                  {repo.owner}/{repo.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-ui text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Started {formatDate(repo.createdAt)}
                  </span>
                  <StatusBadge status={repo.status} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:justify-self-end">
              <Link
                href={`/repo/${repo._id}`}
                className="font-ui text-sm font-semibold uppercase tracking-[0.14em] text-foreground underline decoration-black underline-offset-4 transition-colors hover:text-link"
              >
                Open progress
              </Link>
              <Link
                href={`/repo/${repo._id}`}
                className="text-muted-foreground transition-colors hover:text-link"
                aria-label={`Open ${repo.owner}/${repo.name} progress`}
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => {
                  setDeleteTarget({ id: repo._id, name: `${repo.owner}/${repo.name}` })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
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
      <div className="border-y border-black">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full border-t border-black first:border-t-0" />
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
      <ol className="border-y border-black">
        {savedAnalyses.map((sa, index) => (
          <li
            key={sa._id}
            className="grid gap-3 border-t border-black py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="font-display text-3xl leading-none tracking-[-0.04em] text-foreground sm:text-4xl">
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="space-y-1">
              <p className="editorial-kicker text-muted-foreground">Saved analysis</p>
              <Link
                href={`/analysis/${sa.slug}`}
                className="font-display text-[1.45rem] leading-[1.02] tracking-[-0.04em] text-foreground transition-colors hover:text-link sm:text-[1.6rem]"
              >
                {sa.owner}/{sa.name}
              </Link>
              <div className="grid gap-x-4 gap-y-1 font-ui text-xs text-muted-foreground sm:grid-cols-2">
                <span>Model: {getModelName(sa.model)}</span>
                <span>Filed {formatDate(sa.createdAt, true)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:justify-self-end">
              <a
                href={sa.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui text-xs font-semibold uppercase tracking-[0.14em] text-foreground underline decoration-black underline-offset-4 transition-colors hover:text-link"
                aria-label={`Open ${sa.owner}/${sa.name} repository`}
              >
                Repo
              </a>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-foreground"
                onClick={() => {
                  setDeleteTarget({ id: sa._id, name: `${sa.owner}/${sa.name}` })
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ol>

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
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto flex w-full max-w-400 flex-col px-4 pb-20 sm:px-6 lg:px-8">
        <section className="grid gap-10 border-b border-black py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] lg:items-center lg:py-14">
          <div className="space-y-6">
            {/* <p className="editorial-kicker text-muted-foreground">Repository analysis desk</p> */}
            <div className="space-y-4">
              <h1 className="font-display text-[3.15rem] leading-[1.02] tracking-[-0.05em] text-foreground sm:text-[4.6rem] lg:max-w-[13ch]">
                Every codebase, a readable briefing.
              </h1>
              <p className="max-w-2xl font-body text-[1.12rem] leading-8 text-foreground sm:text-[1.2rem]">
                RepoGuide turns any public GitHub repository into a readable briefing: structure,
                system boundaries, deeper implementation notes, and exportable markdown you can
                keep.
              </p>
            </div>

            <div className="grid gap-4 border-t border-black pt-5 sm:grid-cols-3">
              <div className="space-y-2 border-t border-black pt-3 sm:border-t-0 sm:pt-0">
                <p className="editorial-kicker text-muted-foreground">Output</p>
                <p className="font-ui text-base font-semibold text-foreground">
                  Orientation + deep dive
                </p>
              </div>
              <div className="space-y-2 border-t border-black pt-3 sm:border-t-0 sm:pt-0">
                <p className="editorial-kicker text-muted-foreground">Format</p>
                <p className="font-ui text-base font-semibold text-foreground">
                  Live progress, saved reports, markdown export
                </p>
              </div>
              <div className="space-y-2 border-t border-black pt-3 sm:border-t-0 sm:pt-0">
                <p className="editorial-kicker text-muted-foreground">Scope</p>
                <p className="font-ui text-base font-semibold text-foreground">
                  Public repositories by default
                </p>
              </div>
            </div>
          </div>

          <figure className="space-y-3">
            <div className="overflow-hidden border border-black">
              <Image
                src="/images/repoguide1.png"
                alt="RepoGuide hero illustration"
                width={1366}
                height={768}
                priority
                className="h-75 w-full object-cover sm:h-90"
              />
            </div>
            {/* <figcaption className="font-body text-sm leading-6 text-muted-foreground">
              Repository research rendered as a print-like front page: large headlines, hard rules,
              and zero dashboard chrome.
            </figcaption> */}
          </figure>
        </section>

        <section className="grid gap-8 border-b border-black py-10 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)] lg:gap-12 lg:py-12">
          <div className="space-y-4">
            <span className="editorial-ribbon">Start Analysis</span>
            <h2 className="font-display text-[2.5rem] leading-[1.04] tracking-[-0.04em] text-foreground sm:text-[3.2rem]">
              Feed the desk a repository.
            </h2>
            <p className="font-body text-[1.05rem] leading-8 text-muted-foreground">
              Paste a GitHub URL, choose a model, and let the pipeline fetch code, produce the
              orientation pass, then expand into a deeper editorial read.
            </p>
            <p className="border-t border-black pt-4 font-ui text-sm leading-6 text-muted-foreground">
              Private repository support requires your own GitHub token in the Convex environment as
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-foreground">
                {' '}
                GITHUB_ACCESS_TOKEN
              </span>
              .
            </p>
          </div>

          <div className="border-t-2 border-black pt-6 lg:border-t-0 lg:border-l-2 lg:pl-8 lg:pt-0">
            <RepoInput />
          </div>
        </section>

        <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:py-12">
          <div className="space-y-5">
            <div className="space-y-4">
              <span className="editorial-ribbon">Saved Analyses</span>
              <p className="max-w-2xl font-body text-[1.03rem] leading-8 text-muted-foreground">
                Completed briefings stay here as numbered features. Open a report to browse the full
                markdown document, jump by heading, copy it, or export it.
              </p>
            </div>
            <SavedAnalysesList />
          </div>

          <div className="space-y-5">
            <div className="space-y-4">
              <span className="editorial-ribbon">In Progress</span>
              <p className="font-body text-[1.03rem] leading-8 text-muted-foreground">
                Active jobs stay visible while the pipeline fetches code and writes the two analysis
                passes.
              </p>
            </div>
            <RepoList />
          </div>
        </section>
      </main>
    </div>
  )
}
