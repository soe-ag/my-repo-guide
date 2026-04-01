import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

function getTodayDateUTC(): string {
  return new Date().toISOString().split('T')[0]
}

export const getTodayCount = query({
  args: {},
  handler: async (ctx) => {
    const today = getTodayDateUTC()
    const records = await ctx.db
      .query('freeUsage')
      .withIndex('by_date', (q) => q.eq('date', today))
      .collect()
    return records.reduce((sum, r) => sum + r.count, 0)
  },
})

export const increment = mutation({
  args: { amount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const today = getTodayDateUTC()
    const amount = args.amount ?? 1
    const record = await ctx.db
      .query('freeUsage')
      .withIndex('by_date', (q) => q.eq('date', today))
      .first()
    if (record) {
      await ctx.db.patch(record._id, { count: record.count + amount })
    } else {
      await ctx.db.insert('freeUsage', { date: today, count: amount })
    }
  },
})
