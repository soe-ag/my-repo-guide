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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repo-url">GitHub Repository URL</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="repo-url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="model">AI Model</Label>
          {model === FREE_MODELS_ROUTER_ID && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {todayFreeCount ?? '…'}/{FREE_DAILY_LIMIT} free requests today
            </span>
          )}
        </div>
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
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Repository'
        )}
      </Button>
    </form>
  )
}
