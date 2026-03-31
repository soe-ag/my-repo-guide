import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  repos: defineTable({
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
    fileTree: v.string(),
    fetchedFiles: v.string(),
    status: v.union(
      v.literal('fetching'),
      v.literal('analyzing'),
      v.literal('done'),
      v.literal('error')
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_createdAt', ['createdAt']),

  analyses: defineTable({
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
    createdAt: v.number(),
  }).index('by_repoId', ['repoId']),

  savedAnalyses: defineTable({
    repoUrl: v.string(),
    owner: v.string(),
    name: v.string(),
    slug: v.string(),
    model: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_createdAt', ['createdAt']),
})
