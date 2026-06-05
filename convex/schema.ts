import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The data model for EchoCoach.
// A "review" is one completed post-class message. We keep the coach's four
// raw answers AND the final polished message, so we can re-polish or show
// history later without losing the original input.
export default defineSchema({
  reviews: defineTable({
    studentName: v.string(), // who the class was for
    whatWeDid: v.string(), // answer 1: what we did in the class
    progress: v.string(), // answer 2: what the progress was
    nextSteps: v.string(), // answer 3: next steps and practice
    message: v.string(), // the final, approved review message
    createdAt: v.number(), // ms timestamp, used for ordering the log
  }).index("by_createdAt", ["createdAt"]),
});
