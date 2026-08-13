import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The data model for EchoCoach.
// A "review" is one completed post-class message. We keep the coach's four
// raw answers AND the final polished message, so we can re-polish or show
// history later without losing the original input.
export default defineSchema({
  students: defineTable({
    studentId: v.string(),
    name: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    startDate: v.string(),
    baselineClassesTaken: v.number(),
    baselineThroughDate: v.string(),
    notes: v.optional(v.string()),
  }).index("by_studentId", ["studentId"]),

  classes: defineTable({
    classId: v.string(),
    displayName: v.string(),
    memberStudentIds: v.array(v.string()),
    classType: v.union(v.literal("1:1"), v.literal("1:2")),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    cycle: v.string(),
  }).index("by_classId", ["classId"]),

  reviews: defineTable({
    studentId: v.optional(v.string()), // stable identity for seeded students
    classNumber: v.optional(v.number()), // fixed sequence number once saved
    studentName: v.string(), // who the class was for
    whatWeDid: v.string(), // answer 1: what we did in the class
    progress: v.string(), // answer 2: what the progress was
    nextSteps: v.string(), // answer 3: next steps and practice
    message: v.string(), // the final, approved review message
    createdAt: v.number(), // ms timestamp, used for ordering the log
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_studentId", ["studentId"])
    .index("by_studentId_createdAt", ["studentId", "createdAt"]),
});
