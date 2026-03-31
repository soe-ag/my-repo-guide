'use node'

import { v } from 'convex/values'
import { action } from './_generated/server'
import { api } from './_generated/api'

const PRIORITY_PATTERNS = [
  /^package\.json$/,
  /^tsconfig.*\.json$/,
  /^next\.config\./,
  /^vite\.config\./,
  /^nuxt\.config\./,
  /^tailwind\.config\./,
  /^postcss\.config\./,
  /^drizzle\.config\./,
  /^prisma\/schema\.prisma$/,
  /^\.env\.example$/,
  /^README\.md$/i,
  /^docker-compose/,
  /^Dockerfile$/,
  /schema\.(ts|js|prisma)$/,
  /convex\/schema\.(ts|js)$/,
  /middleware\.(ts|js)$/,
]

const ROUTE_PATTERNS = [
  /^(app|src\/app)\/.*page\.(tsx|jsx|ts|js)$/,
  /^(app|src\/app)\/.*layout\.(tsx|jsx|ts|js)$/,
  /^(app|src\/app)\/.*route\.(tsx|jsx|ts|js)$/,
  /^(pages|src\/pages)\/.*\.(tsx|jsx|ts|js)$/,
  /^(routes|src\/routes)\/.*\.(tsx|jsx|ts|js)$/,
]

const SOURCE_PATTERNS = [/\.(tsx|jsx|ts|js)$/]

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.cache\//,
  /coverage\//,
  /\.husky\//,
  /\.vscode\//,
  /\.idea\//,
  /\.lock$/,
  /lock\.json$/,
  /\.map$/,
  /\.min\./,
  /\.d\.ts$/,
  /__tests__\//,
  /\.test\./,
  /\.spec\./,
]

function shouldIgnore(path: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(path))
}

function isPriority(path: string): boolean {
  return PRIORITY_PATTERNS.some((p) => p.test(path))
}

function isRoute(path: string): boolean {
  return ROUTE_PATTERNS.some((p) => p.test(path))
}

function isSource(path: string): boolean {
  return SOURCE_PATTERNS.some((p) => p.test(path))
}

interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  size?: number
}

async function githubFetch(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RepoGuide',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API error ${res.status}: ${body}`)
  }
  return res.json()
}

async function fetchFileContent(
  owner: string,
  name: string,
  path: string,
  branch: string,
  token?: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${branch}`
  const data = await githubFetch(url, token)
  if (data.encoding === 'base64' && data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8')
  }
  return ''
}

export const fetchRepo = action({
  args: {
    repoId: v.id('repos'),
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const token = process.env.GITHUB_ACCESS_TOKEN

    try {
      // 1. Fetch repo info
      const repoInfo = await githubFetch(
        `https://api.github.com/repos/${args.owner}/${args.name}`,
        token
      )
      const defaultBranch = repoInfo.default_branch || 'main'
      const isPrivate = repoInfo.private || false

      // 2. Fetch file tree (recursive)
      const treeData = await githubFetch(
        `https://api.github.com/repos/${args.owner}/${args.name}/git/trees/${defaultBranch}?recursive=1`,
        token
      )

      const allFiles: GitHubTreeItem[] = (treeData.tree || []).filter(
        (item: GitHubTreeItem) => item.type === 'blob' && !shouldIgnore(item.path)
      )

      const fileTree = allFiles.map((f) => f.path)

      // 3. Prioritize files to fetch (cap at ~50)
      const priorityFiles = allFiles.filter((f) => isPriority(f.path))
      const routeFiles = allFiles.filter((f) => isRoute(f.path) && !isPriority(f.path))
      const sourceFiles = allFiles
        .filter(
          (f) =>
            isSource(f.path) && !isPriority(f.path) && !isRoute(f.path) && (f.size || 0) < 50000
        )
        .sort((a, b) => (b.size || 0) - (a.size || 0))

      const filesToFetch: string[] = [
        ...priorityFiles.map((f) => f.path),
        ...routeFiles.map((f) => f.path),
        ...sourceFiles.map((f) => f.path),
      ].slice(0, 50)

      // 4. Fetch file contents in parallel (batches of 10)
      const fetchedFiles: Record<string, string> = {}
      for (let i = 0; i < filesToFetch.length; i += 10) {
        const batch = filesToFetch.slice(i, i + 10)
        const results = await Promise.all(
          batch.map(async (path) => {
            try {
              const content = await fetchFileContent(
                args.owner,
                args.name,
                path,
                defaultBranch,
                token
              )
              return { path, content }
            } catch {
              return { path, content: '// Failed to fetch' }
            }
          })
        )
        for (const { path, content } of results) {
          fetchedFiles[path] = content
        }
      }

      // 5. Store in Convex
      await ctx.runMutation(api.repos.updateRepoData, {
        repoId: args.repoId,
        isPrivate,
        defaultBranch,
        fileTree: JSON.stringify(fileTree),
        fetchedFiles: JSON.stringify(fetchedFiles),
      })

      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'analyzing',
      })

      return { success: true, fileCount: filesToFetch.length }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'error',
        errorMessage: `GitHub fetch failed: ${message}`,
      })
      return { success: false, error: message }
    }
  },
})
