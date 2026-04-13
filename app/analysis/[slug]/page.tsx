'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Download, ExternalLink, Copy, Check, Trash2, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DeleteAnalysisDialog } from '@/components/delete-analysis-dialog'
import Image from 'next/image'

interface HeadingItem {
  id: string
  text: string
  level: number
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function extractHeadings(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = []
  const lines = markdown.split('\n')
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      headings.push({ id, text, level })
    }
  }
  return headings
}

function Sidebar({
  headings,
  activeId,
  onSelect,
  mobileOpen,
  onClose,
}: {
  headings: HeadingItem[]
  activeId: string
  onSelect: (id: string) => void
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-76 border-r border-black bg-background px-4 py-6 transition-transform
          lg:sticky lg:top-0 lg:z-0 lg:block lg:h-screen lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="editorial-kicker text-muted-foreground">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 border-b border-black pb-4">
          <p className="editorial-kicker text-muted-foreground">Saved analysis</p>
          <p className="font-display text-3xl leading-none tracking-[-0.04em] text-foreground">
            Reading order
          </p>
        </div>

        <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto pt-4 pr-1">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                onSelect(h.id)
                onClose()
              }}
              className={`
                block w-full border-t border-black py-3 text-left text-sm transition-colors first:border-t-0
                ${h.level === 1 ? 'font-ui text-base font-semibold text-foreground' : h.level === 2 ? 'pl-4 font-ui font-medium text-foreground' : 'pl-8 font-ui text-muted-foreground'}
                ${activeId === h.id ? 'text-link' : 'hover:text-link'}
              `}
            >
              {h.text}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default function AnalysisPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug
  const analysis = useQuery(api.savedAnalyses.getBySlug, { slug })
  const removeAnalysis = useMutation(api.savedAnalyses.remove)

  const [activeId, setActiveId] = useState('')
  const [copied, setCopied] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const headings = useMemo(() => (analysis ? extractHeadings(analysis.content) : []), [analysis])

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[]

    for (const el of elements) {
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }, [])

  function handleCopy() {
    if (!analysis) return
    navigator.clipboard.writeText(analysis.content)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExport() {
    if (!analysis) return
    const blob = new Blob([analysis.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.owner}-${analysis.name}-analysis.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown file downloaded!')
  }

  async function handleDelete() {
    if (!analysis) return
    await removeAnalysis({ id: analysis._id })
    toast.success('Analysis deleted')
    router.push('/')
  }

  if (analysis === undefined) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-4 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-175 w-full" />
      </div>
    )
  }

  if (analysis === null) {
    return (
      <div className="mx-auto flex w-full max-w-400 flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-4 border-t border-black pt-6">
          <p className="editorial-kicker text-muted-foreground">Missing article</p>
          <h1 className="font-display text-4xl leading-none tracking-[-0.04em]">
            Analysis not found.
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-400">
      <Sidebar
        headings={headings}
        activeId={activeId}
        onSelect={scrollTo}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-w-0 flex-1 lg:border-l lg:border-black">
        <div className="sticky top-0 z-30 border-b border-black bg-background/95 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0 space-y-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <Link href="/">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="min-w-0 space-y-1">
                  <p className="editorial-kicker text-muted-foreground">Saved analysis</p>
                  <h1 className="font-display text-[1.9rem] leading-[1.15] tracking-[-0.04em] sm:text-[2.4rem]">
                    {analysis.owner}/{analysis.name}
                  </h1>
                  <a
                    href={analysis.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-link inline-flex items-center gap-1 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-foreground"
                  >
                    Open repository
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleExport} title="Export .md">
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 border-b border-black pb-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <figure className="space-y-3">
              <div className="overflow-hidden border border-black">
                <Image
                  src="/images/repoguide2.png"
                  alt="Analysis hero illustration"
                  width={1366}
                  height={768}
                  priority
                  className="h-60 w-full object-cover sm:h-75"
                />
              </div>
              <figcaption className="font-body text-sm leading-6 text-muted-foreground">
                The saved briefing is formatted as an editorial feature with navigable section heads
                and exportable markdown.
              </figcaption>
            </figure>

            <div className="space-y-4 border-t border-black pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <div>
                <p className="editorial-kicker text-muted-foreground">Model</p>
                <p className="font-ui text-base font-semibold text-foreground">{analysis.model}</p>
              </div>
              <div>
                <p className="editorial-kicker text-muted-foreground">Filed</p>
                <p className="font-ui text-base font-semibold text-foreground">
                  {formatDate(analysis.createdAt)}
                </p>
              </div>
              <div>
                <p className="editorial-kicker text-muted-foreground">Sections</p>
                <p className="font-ui text-base font-semibold text-foreground">
                  {headings.length} indexed headings
                </p>
              </div>
            </div>
          </div>
        </div>

        <div ref={contentRef} className="max-w-230 px-4 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-black pb-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
            Model {analysis.model} • Filed {formatDate(analysis.createdAt)}
          </div>
          <article className="editorial-prose">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  )
                },
                h2: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  )
                },
                h3: ({ children, ...props }) => {
                  const text = String(children)
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  )
                },
              }}
            >
              {analysis.content}
            </Markdown>
          </article>
        </div>
      </main>

      <DeleteAnalysisDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        repoName={`${analysis.owner}/${analysis.name}`}
      />
    </div>
  )
}
