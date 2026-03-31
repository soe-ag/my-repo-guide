import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    repoId: v.id('repos'),
    type: v.union(
      v.literal('techStack'),
      v.literal('structure'),
      v.literal('architecture'),
      v.literal('routes'),
      v.literal('dataModel'),
      v.literal('patterns'),
      v.literal('learningPath')
    ),
    content: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('analyses', {
      repoId: args.repoId,
      type: args.type,
      content: args.content,
      model: args.model,
      createdAt: Date.now(),
    })
  },
})

export const getByRepo = query({
  args: { repoId: v.id('repos') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('analyses')
      .withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
      .collect()
  },
})

export const deleteByRepo = mutation({
  args: { repoId: v.id('repos') },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query('analyses')
      .withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
      .collect()
    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id)
    }
  },
})
