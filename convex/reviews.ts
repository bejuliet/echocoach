import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Read every saved review, newest first.
// We use the `by_createdAt` index (defined in schema.ts) and order it
// descending so the most recent review shows up at the top of the Log page.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

// Save a finished review to the database.
// Every argument is validated with the `v` validators so we never store
// malformed data. `createdAt` is set on the server with the current time.
export const create = mutation({
  args: {
    studentName: v.string(),
    whatWeDid: v.string(),
    progress: v.string(),
    nextSteps: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
