'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OPENROUTER_MODELS, FREE_MODELS_ROUTER_ID, FREE_DAILY_LIMIT } from '@/lib/prompts'
import { Loader2, Search, Zap } from 'lucide-react'

function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  const cleaned = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')

  // Handle full URLs
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/)
  if (urlMatch) {
    return { owner: urlMatch[1], name: urlMatch[2] }
  }

  // Handle owner/name shorthand
  const shortMatch = cleaned.match(/^([^/]+)\/([^/]+)$/)
  if (shortMatch) {
    return { owner: shortMatch[1], name: shortMatch[2] }
  }

  return null
}

export function RepoInput() {
  const [url, setUrl] = useState('')
  const [model, setModel] = useState<string>(FREE_MODELS_ROUTER_ID)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createRepo = useMutation(api.repos.create)
  const router = useRouter()
  const todayFreeCount = useQuery(api.freeUsage.getTodayCount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      toast.error('Invalid GitHub URL. Use format: https://github.com/owner/repo')
      return
    }

    setIsSubmitting(true)
    try {
      const repoId = await createRepo({
        repoUrl: `https://github.com/${parsed.owner}/${parsed.name}`,
        owner: parsed.owner,
        name: parsed.name,
      })

      router.push(`/repo/${repoId}?model=${encodeURIComponent(model)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create repo entry')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:items-end">
        <div className="space-y-2">
          <p className="editorial-kicker text-muted-foreground">Repository URL</p>
          <p className="font-body max-w-2xl text-base leading-7 text-muted-foreground sm:text-[1.08rem]">
            Paste a public GitHub repository URL or use owner/name shorthand. RepoGuide will fetch
            the codebase, produce a guided orientation, then expand into a deeper reading order.
          </p>
        </div>

        <div className="border-t border-black pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <p className="editorial-kicker text-muted-foreground">Model</p>
          <p className="mt-2 font-ui text-sm leading-6 text-muted-foreground">
            Free model analysis is available immediately. Paid models require your own API
            credentials in development settings.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="repo-url">GitHub Repository URL</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <Input
            id="repo-url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-11"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="model">AI Model</Label>
            {model === FREE_MODELS_ROUTER_ID && (
              <span className="flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Zap className="h-3 w-3" />
                {todayFreeCount ?? '…'}/{FREE_DAILY_LIMIT} free requests today
              </span>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Select value={model} onValueChange={setModel} disabled={isSubmitting}>
              <SelectTrigger id="model" className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {OPENROUTER_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full lg:w-auto" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Repository'
              )}
            </Button>
          </div>
        </div>

        <p className="font-ui text-sm leading-6 text-muted-foreground">
          Paid models are not currently available for analysis. To use a paid model, please add your
          API key in the development settings.
        </p>
      </div>
    </form>
  )
}
