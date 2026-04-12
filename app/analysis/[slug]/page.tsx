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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 border-r bg-background p-4 transition-transform
          lg:sticky lg:top-0 lg:z-0 lg:block lg:h-screen lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="text-sm font-semibold">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-6rem)] pr-2">
          {headings.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                onSelect(h.id)
                onClose()
              }}
              className={`
                block w-full text-left truncate rounded-md px-2 py-1.5 text-sm transition-colors
                ${h.level === 1 ? 'font-semibold' : h.level === 2 ? 'pl-4 font-medium' : 'pl-8 text-muted-foreground'}
                ${activeId === h.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}
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
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-150 w-full" />
      </div>
    )
  }

  if (analysis === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        headings={headings}
        activeId={activeId}
        onSelect={scrollTo}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Link href="/">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {analysis.owner}/{analysis.name}
                </h1>
                <a
                  href={analysis.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                >
                  {analysis.repoUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

        <div className="max-w-4xl px-4 pt-6 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-2xl border shadow-sm">
            <Image
              src="/images/repoguide2.png"
              alt="Analysis hero illustration"
              width={1366}
              height={768}
              priority
              className="h-44 w-full object-cover sm:h-56"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent" />
          </div>
        </div>

        {/* Analysis content */}
        <div ref={contentRef} className="px-4 pt-6 pb-8 sm:px-8 lg:px-12 max-w-4xl">
          <div className="text-muted-foreground text-xs mb-6">
            Model: {analysis.model} &middot; {new Date(analysis.createdAt).toLocaleString()}
          </div>
          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20">
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
