'use node'

import { v } from 'convex/values'
import { action } from './_generated/server'
import { api } from './_generated/api'
import { FREE_MODELS_ROUTER_ID } from '../lib/constants'

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

function truncateContent(content: string, maxChars: number = 6000): string {
  if (content.length <= maxChars) return content
  return content.slice(0, maxChars) + '\n... (truncated)'
}

function truncateFiles(
  files: Record<string, string>,
  maxTotalChars: number,
  maxPerFile: number = 6000
): Record<string, string> {
  const result: Record<string, string> = {}
  let totalChars = 0
  for (const [path, content] of Object.entries(files)) {
    const truncated = truncateContent(content, maxPerFile)
    if (totalChars + truncated.length > maxTotalChars) break
    result[path] = truncated
    totalChars += truncated.length
  }
  return result
}

function getUsableFiles(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).filter(([, content]) => {
      const trimmed = content.trim()
      if (!trimmed) return false
      if (trimmed.startsWith('// Failed to fetch')) return false
      return true
    })
  )
}

interface OpenRouterResult {
  content: string
  usedFreeRouter: boolean
}

async function callOpenRouter(
  prompt: string,
  model: string,
  apiKey: string
): Promise<OpenRouterResult> {
  const isFreeRouter = !model || model === FREE_MODELS_ROUTER_ID
  const effectiveModel = isFreeRouter ? FREE_MODELS_ROUTER_ID : model

  // Build request body: for paid models, add free router as fallback
  const requestBody: Record<string, unknown> = {
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
  }

  if (isFreeRouter) {
    requestBody.model = FREE_MODELS_ROUTER_ID
  } else {
    // Use selected model with free router as fallback
    requestBody.models = [effectiveModel, FREE_MODELS_ROUTER_ID]
    requestBody.route = 'fallback'
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://repo-guide.vercel.app',
      'X-Title': 'RepoGuide',
    },
<<<<<<< HEAD
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert software architect generating a concise repo brief. Use Markdown. Be terse — tables and bullets over prose. Reference actual file names.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
=======
    body: JSON.stringify(requestBody),
>>>>>>> 769a730abe7c7e940ef43f35cb15e650e9dce094
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content || 'No response generated.'

  // Detect whether the free router was actually used (direct or via fallback)
  const actualModel: string = data.model ?? ''
  const usedFreeRouter =
    isFreeRouter || actualModel === FREE_MODELS_ROUTER_ID || actualModel.endsWith(':free')

  return { content, usedFreeRouter }
}

export const analyzeRepo = action({
  args: {
    repoId: v.id('repos'),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKeyRaw = process.env.OPENROUTER_API_KEY
    if (!apiKeyRaw) {
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'error',
        errorMessage: 'OPENROUTER_API_KEY environment variable is not set.',
      })
      return
    }
    const apiKey: string = apiKeyRaw

    const repo = await ctx.runQuery(api.repos.get, { repoId: args.repoId })
    if (!repo) {
      return
    }

    // Resolve effective model: empty string → free models router
    const effectiveModel =
      !args.model || args.model === FREE_MODELS_ROUTER_ID ? FREE_MODELS_ROUTER_ID : args.model

    // Helper: call OpenRouter and increment free-usage counter.
    // Increments BEFORE the call so attempts are tracked even on failure.
    // Also tracks when a paid-model request falls back to the free router.
    async function callAndTrack(prompt: string): Promise<string> {
      const isFreeRouter = effectiveModel === FREE_MODELS_ROUTER_ID
      if (isFreeRouter) {
        await ctx.runMutation(api.freeUsage.increment, {})
      }
      const result = await callOpenRouter(prompt, effectiveModel, apiKey)
      // If paid model fell back to free router, also count that usage
      if (!isFreeRouter && result.usedFreeRouter) {
        await ctx.runMutation(api.freeUsage.increment, {})
      }
      return result.content
    }

    const fileTree: string[] = JSON.parse(repo.fileTree)
    const rawFetchedFiles: Record<string, string> = JSON.parse(repo.fetchedFiles)
    const fetchedFiles = getUsableFiles(rawFetchedFiles)
    const fileTreeStr = fileTree.join('\n')

    const fetchedCount = Object.keys(fetchedFiles).length
    if (fileTree.length === 0 || fetchedCount < 8) {
      await ctx.runMutation(api.repos.updateStatus, {
        repoId: args.repoId,
        status: 'error',
        errorMessage:
          'Insufficient repository data to analyze. GitHub fetch returned too few usable files. ' +
          'Please retry, ensure GitHub token access is configured, or choose a smaller/public repository.',
      })
      return
    }

    try {
      // Step 1 — Orientation (Overview + Tech Stack + Project Structure)
      const { buildOrientationPrompt } = await import('../lib/prompts')
      const configFiles = matchFiles(fetchedFiles, CONFIG_PATTERNS)
      const packageJson = fetchedFiles['package.json'] || '{}'

      const orientationPrompt = buildOrientationPrompt(
        fileTreeStr,
        packageJson,
        truncateFiles(configFiles, 25000)
      )
<<<<<<< HEAD
      const orientationResult = await callOpenRouter(orientationPrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'orientation',
        content: orientationResult,
        model: args.model,
=======
      const techStackResult = await callAndTrack(techStackPrompt)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'techStack',
        content: techStackResult,
        model: effectiveModel,
      })
      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'structure',
        content: techStackResult,
        model: effectiveModel,
>>>>>>> 769a730abe7c7e940ef43f35cb15e650e9dce094
      })

      // Step 2 — Deep Dive (Data Model + Key Flows + Reading Order)
      const { buildDeepDivePrompt } = await import('../lib/prompts')
      const schemaFiles = matchFiles(fetchedFiles, SCHEMA_PATTERNS)
<<<<<<< HEAD
      const routeFiles = matchFiles(fetchedFiles, ROUTE_PATTERNS)

      // Up to 8 key source files not already covered above
      const excludedPaths = new Set([
        ...Object.keys(configFiles),
        ...Object.keys(schemaFiles),
        ...Object.keys(routeFiles),
      ])
      const sourceFiles = Object.fromEntries(
        Object.entries(fetchedFiles)
          .filter(([path]) => /\.(tsx?|jsx?)$/.test(path) && !excludedPaths.has(path))
          .slice(0, 8)
      )

      const deepDivePrompt = buildDeepDivePrompt(
        truncateFiles(schemaFiles, 15000),
        truncateFiles(routeFiles, 15000),
        truncateFiles(sourceFiles, 10000),
        fileTreeStr
      )
      const deepDiveResult = await callOpenRouter(deepDivePrompt, args.model, apiKey)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'deepDive',
        content: deepDiveResult,
        model: args.model,
=======

      const { buildDataModelPrompt } = await import('../lib/prompts')
      const dataModelPrompt = buildDataModelPrompt(truncateFiles(schemaFiles, 40000), fileTreeStr)
      const dataModelResult = await callAndTrack(dataModelPrompt)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'dataModel',
        content: dataModelResult,
        model: effectiveModel,
      })

      // Step 3: Routes
      const routeFiles = matchFiles(fetchedFiles, ROUTE_PATTERNS)

      const { buildRoutesPrompt } = await import('../lib/prompts')
      const routesPrompt = buildRoutesPrompt(truncateFiles(routeFiles, 50000), fileTreeStr)
      const routesResult = await callAndTrack(routesPrompt)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'routes',
        content: routesResult,
        model: effectiveModel,
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
      const patternsResult = await callAndTrack(patternsPrompt)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'architecture',
        content: patternsResult,
        model: effectiveModel,
      })
      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'patterns',
        content: patternsResult,
        model: effectiveModel,
      })

      // Step 5: Learning Path (synthesis)
      const { buildLearningPathPrompt } = await import('../lib/prompts')
      const learningPathPrompt = buildLearningPathPrompt(
        techStackResult,
        dataModelResult,
        routesResult,
        patternsResult
      )
      const learningPathResult = await callAndTrack(learningPathPrompt)

      await ctx.runMutation(api.analyses.create, {
        repoId: args.repoId,
        type: 'learningPath',
        content: learningPathResult,
        model: effectiveModel,
>>>>>>> 769a730abe7c7e940ef43f35cb15e650e9dce094
      })

      // Combine and save
      const combinedMarkdown = [
        `# RepoGuide Analysis: ${repo.owner}/${repo.name}`,
        `> ${repo.repoUrl}`,
        `> Generated on ${new Date().toLocaleDateString()} using ${effectiveModel}`,
        '',
        orientationResult,
        '',
        '---',
        '',
        deepDiveResult,
        '',
      ].join('\n')

      const slug: string = await ctx.runQuery(api.savedAnalyses.generateSlug, {
        owner: repo.owner,
        name: repo.name,
      })

      await ctx.runMutation(api.savedAnalyses.create, {
        repoUrl: repo.repoUrl,
        owner: repo.owner,
        name: repo.name,
        slug,
        model: effectiveModel,
        content: combinedMarkdown,
      })

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
