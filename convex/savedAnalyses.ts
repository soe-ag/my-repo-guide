import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    slug: v.string(),
    model: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('savedAnalyses', {
      repoUrl: args.repoUrl,
      owner: args.owner,
      name: args.name,
      slug: args.slug,
      model: args.model,
      content: args.content,
      createdAt: Date.now(),
    })
  },
})

export const generateSlug = query({
  args: {
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const base = `${args.owner}-${args.name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check for existing slugs with this base
    const existing = await ctx.db.query('savedAnalyses').withIndex('by_slug').collect()

    const matchingSlugs = existing
      .map((e) => e.slug)
      .filter((s) => s === base || s.startsWith(`${base}-`))

    if (matchingSlugs.length === 0) {
      return base
    }

    // Find next available number
    let max = 1
    for (const slug of matchingSlugs) {
      if (slug === base) continue
      const suffix = slug.slice(base.length + 1)
      const num = parseInt(suffix, 10)
      if (!isNaN(num) && num >= max) {
        max = num + 1
      }
    }
    return `${base}-${max}`
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('savedAnalyses')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const [savedAnalyses, repos] = await Promise.all([
      ctx.db.query('savedAnalyses').withIndex('by_createdAt').order('desc').collect(),
      ctx.db.query('repos').withIndex('by_createdAt').order('desc').collect(),
    ])

    const repoVisibility = new Map<string, boolean>()
    for (const repo of repos) {
      const key = `${repo.owner}/${repo.name}`.toLowerCase()
      if (!repoVisibility.has(key)) {
        repoVisibility.set(key, repo.isPrivate)
      }
    }

    return savedAnalyses.map((analysis) => ({
      ...analysis,
      isPrivate: repoVisibility.get(`${analysis.owner}/${analysis.name}`.toLowerCase()) ?? false,
    }))
  },
})

export const getLatestByRepo = query({
  args: {
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query('savedAnalyses')
      .withIndex('by_createdAt')
      .order('desc')
      .collect()
    return all.find((a) => a.owner === args.owner && a.name === args.name) ?? null
  },
})

export const remove = mutation({
  args: { id: v.id('savedAnalyses') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
