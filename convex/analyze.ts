'use node'

import { v } from 'convex/values'
import { action } from './_generated/server'
import { api } from './_generated/api'

const SCHEMA_PATTERNS = [
  /schema\.(ts|js|prisma)$/,
  /models?\//,
  /prisma\/schema\.prisma$/,
  /drizzle\//,
  /convex\/schema\.(ts|js)$/,
  /types?\.(ts|js)$/,
  /entities\//,
]

const ROUTE_PATTERNS = [
  /^(app|src\/app)\/.*page\.(tsx|jsx|ts|js)$/,
  /^(app|src\/app)\/.*layout\.(tsx|jsx|ts|js)$/,
  /^(app|src\/app)\/.*route\.(tsx|jsx|ts|js)$/,
  /^(pages|src\/pages)\/.*\.(tsx|jsx|ts|js)$/,
  /^(routes|src\/routes)\/.*\.(tsx|jsx|ts|js)$/,
  /api\//,
]

const CONFIG_PATTERNS = [
  /^package\.json$/,
  /^tsconfig.*\.json$/,
  /^next\.config\./,
  /^vite\.config\./,
  /^nuxt\.config\./,
  /^tailwind\.config\./,
  /^postcss\.config\./,
  /^drizzle\.config\./,
  /^\.env\.example$/,
  /^Dockerfile$/,
  /^docker-compose/,
  /^README\.md$/i,
  /middleware\.(ts|js)$/,
]

function matchFiles(files: Record<string, string>, patterns: RegExp[]): Record<string, string> {
  const matched: Record<string, string> = {}
  for (const [path, content] of Object.entries(files)) {
    if (patterns.some((p) => p.test(path))) {
      matched[path] = content
    }
  }
  return matched
}

function truncateContent(content: string, maxChars: number = 8000): string {
  if (content.length <= maxChars) return content
  return content.slice(0, maxChars) + '\n... (truncated)'
}

function truncateFiles(
  files: Record<string, string>,
  maxTotalChars: number = 80000
): Record<string, string> {
  const result: Record<string, string> = {}
  let totalChars = 0
  for (const [path, content] of Object.entries(files)) {
    const truncated = truncateContent(content)
    if (totalChars + truncated.length > maxTotalChars) break
    result[path] = truncated
    totalChars += truncated.length
  }
  return result
}

async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://repo-guide.vercel.app',
      'X-Title': 'RepoGuide',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert software architect analyzing a GitHub repository. Provide detailed, structured analysis in Markdown format. Be specific — reference actual file names, function names, and code patterns.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response generated.'
}

export const analyzeRepo = action({
  args: {
    repoId: v.id('repos'),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'error',
        errorMessage: 'OPENROUTER_API_KEY environment variable is not set.',
      })
      return
    }

    const repo = await ctx.runQuery(api.repos.get, { repoId: args.repoId })
    if (!repo) {
      return
    }

    const fileTree: string[] = JSON.parse(repo.fileTree)
    const fetchedFiles: Record<string, string> = JSON.parse(repo.fetchedFiles)
    const fileTreeStr = fileTree.join('\n')

    try {
      // Step 1: Tech Stack + Structure
      const configFiles = matchFiles(fetchedFiles, CONFIG_PATTERNS)
      const packageJson = fetchedFiles['package.json'] || '{}'

      const { buildTechStackPrompt } = await import('../lib/prompts')

      const techStackPrompt = buildTechStackPrompt(
        fileTreeStr,
        packageJson,
        truncateFiles(configFiles, 30000)
      )
      const techStackResult = await callOpenRouter(techStackPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'techStack',
        content: techStackResult,
        model: args.model,
      })
      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'structure',
        content: techStackResult,
        model: args.model,
      })

      // Step 2: Data Model
      const schemaFiles = matchFiles(fetchedFiles, SCHEMA_PATTERNS)

      const { buildDataModelPrompt } = await import('../lib/prompts')
      const dataModelPrompt = buildDataModelPrompt(truncateFiles(schemaFiles, 40000), fileTreeStr)
      const dataModelResult = await callOpenRouter(dataModelPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'dataModel',
        content: dataModelResult,
        model: args.model,
      })

      // Step 3: Routes
      const routeFiles = matchFiles(fetchedFiles, ROUTE_PATTERNS)

      const { buildRoutesPrompt } = await import('../lib/prompts')
      const routesPrompt = buildRoutesPrompt(truncateFiles(routeFiles, 50000), fileTreeStr)
      const routesResult = await callOpenRouter(routesPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'routes',
        content: routesResult,
        model: args.model,
      })

      // Step 4: Patterns + Architecture
      const allSourceFiles = Object.fromEntries(
        Object.entries(fetchedFiles).filter(
          ([path]) =>
            /\.(tsx?|jsx?|py|rb|go|rs)$/.test(path) && !CONFIG_PATTERNS.some((p) => p.test(path))
        )
      )

      const { buildPatternsPrompt } = await import('../lib/prompts')
      const patternsPrompt = buildPatternsPrompt(truncateFiles(allSourceFiles, 60000), fileTreeStr)
      const patternsResult = await callOpenRouter(patternsPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'architecture',
        content: patternsResult,
        model: args.model,
      })
      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'patterns',
        content: patternsResult,
        model: args.model,
      })

      // Step 5: Learning Path (synthesis)
      const { buildLearningPathPrompt } = await import('../lib/prompts')
      const learningPathPrompt = buildLearningPathPrompt(
        techStackResult,
        dataModelResult,
        routesResult,
        patternsResult
      )
      const learningPathResult = await callOpenRouter(learningPathPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'learningPath',
        content: learningPathResult,
        model: args.model,
      })

      // Done!
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'done',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'error',
        errorMessage: `Analysis failed: ${message}`,
      })
    }
  },
})
