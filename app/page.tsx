'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { RepoInput } from '@/components/repo-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GitBranch, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'done' ? 'default' : status === 'error' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

function RepoList() {
  const repos = useQuery(api.repos.list)

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
        No repositories analyzed yet. Enter a GitHub URL above to get started.
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
          <h2 className="mb-4 text-lg font-semibold">Past Analyses</h2>
          <RepoList />
        </div>
      </main>
    </div>
  )
}
