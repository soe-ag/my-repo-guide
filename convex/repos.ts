import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: {
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const repoId = await ctx.db.insert('repos', {
      repoUrl: args.repoUrl,
      owner: args.owner,
      name: args.name,
      isPrivate: false,
      defaultBranch: 'main',
      fileTree: '[]',
      fetchedFiles: '{}',
      status: 'fetching',
      createdAt: Date.now(),
    })
    return repoId
  },
})

export const updateStatus = mutation({
  args: {
    repoId: v.id('repos'),
    status: v.union(
      v.literal('fetching'),
      v.literal('analyzing'),
      v.literal('done'),
      v.literal('error')
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repoId, {
      status: args.status,
      ...(args.errorMessage !== undefined && {
        errorMessage: args.errorMessage,
      }),
    })
  },
})

export const updateRepoData = mutation({
  args: {
    repoId: v.id('repos'),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
    fileTree: v.string(),
    fetchedFiles: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repoId, {
      isPrivate: args.isPrivate,
      defaultBranch: args.defaultBranch,
      fileTree: args.fileTree,
      fetchedFiles: args.fetchedFiles,
    })
  },
})

export const get = query({
  args: { repoId: v.id('repos') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repoId)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('repos').withIndex('by_createdAt').order('desc').collect()
  },
})

export const listInProgress = query({
  args: {},
  handler: async (ctx) => {
    const repos = await ctx.db.query('repos').withIndex('by_createdAt').order('desc').collect()
    return repos.filter((repo) => repo.status === 'fetching' || repo.status === 'analyzing')
  },
})

export const remove = mutation({
  args: { repoId: v.id('repos') },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query('analyses')
      .withIndex('by_repoId', (q) => q.eq('repoId', args.repoId))
      .collect()

    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id)
    }

    await ctx.db.delete(args.repoId)
  },
})
