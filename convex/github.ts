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

const DOC_PATTERNS = [
  /^README\.md$/i,
  /^docs\/.*\.(md|mdx)$/i,
  /^ARCHITECTURE\.md$/i,
  /^CONTRIBUTING\.md$/i,
  /^CHANGELOG\.md$/i,
]

const MAX_FILE_SIZE_BYTES = 120000
const MAX_FILES_TO_FETCH = 120
const MAX_PER_TOP_LEVEL_DIR = 18
const MAX_PER_EXTENSION = 36
const FETCH_BATCH_SIZE = 12
const MAX_FETCH_FAILURE_RATIO = 0.4
const MIN_FETCHED_FILES = 12

const CRITICAL_PATHS = ['package.json', 'README.md', 'readme.md']

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

function isDoc(path: string): boolean {
  return DOC_PATTERNS.some((p) => p.test(path))
}

function getTopLevelDir(path: string): string {
  const slashIndex = path.indexOf('/')
  return slashIndex === -1 ? '(root)' : path.slice(0, slashIndex)
}

function getExtension(path: string): string {
  const match = path.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : '(none)'
}

function scoreFile(path: string, size: number): number {
  let score = 0

  if (isPriority(path)) score += 1000
  if (isRoute(path)) score += 700
  if (isDoc(path)) score += 320
  if (isSource(path)) score += 220

  if (/^(src|app|pages|routes|convex|server|api|lib)\//.test(path)) {
    score += 90
  }

  if (/(auth|schema|config|middleware|router|service|controller)/i.test(path)) {
    score += 50
  }

  if (size <= 8000) score += 80
  else if (size <= 30000) score += 45
  else if (size <= 80000) score += 12
  else if (size > MAX_FILE_SIZE_BYTES) score -= 300

  return score
}

function pickFilesForFetch(allFiles: GitHubTreeItem[]): string[] {
  const eligible = allFiles.filter((file) => {
    const size = file.size || 0
    if (size > MAX_FILE_SIZE_BYTES) return false
    return isPriority(file.path) || isRoute(file.path) || isSource(file.path) || isDoc(file.path)
  })

  const scored = eligible
    .map((file) => ({
      ...file,
      score: scoreFile(file.path, file.size || 0),
    }))
    .sort((a, b) => b.score - a.score)

  const targetCount = Math.min(MAX_FILES_TO_FETCH, Math.max(40, scored.length))
  const selected: string[] = []
  const selectedSet = new Set<string>()
  const perDirCount = new Map<string, number>()
  const perExtCount = new Map<string, number>()

  const trySelect = (path: string, enforceCaps: boolean) => {
    if (selectedSet.has(path)) return

    if (enforceCaps) {
      const dir = getTopLevelDir(path)
      const ext = getExtension(path)
      const dirCount = perDirCount.get(dir) || 0
      const extCount = perExtCount.get(ext) || 0
      if (dirCount >= MAX_PER_TOP_LEVEL_DIR) return
      if (extCount >= MAX_PER_EXTENSION) return
    }

    selected.push(path)
    selectedSet.add(path)
    const dir = getTopLevelDir(path)
    const ext = getExtension(path)
    perDirCount.set(dir, (perDirCount.get(dir) || 0) + 1)
    perExtCount.set(ext, (perExtCount.get(ext) || 0) + 1)
  }

  // First pass: always keep key config and architectural files.
  for (const file of scored) {
    if (selected.length >= targetCount) break
    if (isPriority(file.path) || isRoute(file.path)) {
      trySelect(file.path, false)
    }
  }

  // Second pass: diversify coverage across folders and languages.
  for (const file of scored) {
    if (selected.length >= targetCount) break
    trySelect(file.path, true)
  }

  // Final backfill if caps prevented reaching target.
  if (selected.length < targetCount) {
    for (const file of scored) {
      if (selected.length >= targetCount) break
      trySelect(file.path, false)
    }
  }

  return selected
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

      // 3. Select files with balanced coverage across repo areas.
      const filesToFetch = pickFilesForFetch(allFiles)

      // 4. Fetch file contents in parallel (small batches avoid rate spikes)
      const fetchedFiles: Record<string, string> = {}
      let failedFetchCount = 0
      let emptyContentCount = 0
      for (let i = 0; i < filesToFetch.length; i += FETCH_BATCH_SIZE) {
        const batch = filesToFetch.slice(i, i + FETCH_BATCH_SIZE)
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
              return { path, content, ok: true }
            } catch {
              return { path, content: '', ok: false }
            }
          })
        )
        for (const { path, content, ok } of results) {
          if (!ok) {
            failedFetchCount += 1
            continue
          }

          if (!content.trim()) {
            emptyContentCount += 1
            continue
          }

          fetchedFiles[path] = content
        }
      }

      const fetchedPaths = new Set(Object.keys(fetchedFiles))
      const hasCriticalFile = CRITICAL_PATHS.some((path) => fetchedPaths.has(path))
      const attemptedFetches = filesToFetch.length || 1
      const failureRatio = failedFetchCount / attemptedFetches
      const minRequiredFetched = Math.min(MIN_FETCHED_FILES, filesToFetch.length)

      if (
        Object.keys(fetchedFiles).length < minRequiredFetched ||
        failureRatio > MAX_FETCH_FAILURE_RATIO ||
        !hasCriticalFile
      ) {
        const reasonParts = [
          `fetched=${Object.keys(fetchedFiles).length}`,
          `failed=${failedFetchCount}`,
          `empty=${emptyContentCount}`,
          `requested=${filesToFetch.length}`,
          `minRequired=${minRequiredFetched}`,
          `failureRatio=${failureRatio.toFixed(2)}`,
          `hasCriticalFile=${hasCriticalFile}`,
        ]
        throw new Error(
          `Insufficient repository data fetched from GitHub (${reasonParts.join(', ')}). ` +
            'This is often caused by API rate limits, missing GitHub token, or private-repo access issues.'
        )
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

      return {
        success: true,
        fileCount: filesToFetch.length,
        fetchedCount: Object.keys(fetchedFiles).length,
        failedFetchCount,
        emptyContentCount,
        totalRepoFiles: allFiles.length,
        coverageRatio:
          allFiles.length > 0
            ? Math.round((filesToFetch.length / allFiles.length) * 1000) / 1000
            : 0,
      }
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
