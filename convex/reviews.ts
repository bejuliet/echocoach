import { query, mutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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

export const nextClassNumber = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, { studentId }) => {
    return await computeNextClassNumber(ctx, studentId);
  },
});

// Save a finished review to the database.
// Every argument is validated with the `v` validators so we never store
// malformed data. `createdAt` is set on the server with the current time.
export const create = mutation({
  args: {
    studentId: v.optional(v.string()),
    studentName: v.string(),
    whatWeDid: v.string(),
    progress: v.string(),
    nextSteps: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { studentId: requestedStudentId, ...reviewFields } = args;
    let studentId: string | undefined;
    let studentName = args.studentName;

    if (requestedStudentId) {
      const student = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q) =>
          q.eq("studentId", requestedStudentId),
        )
        .unique();
      if (!student || student.status !== "Active") {
        throw new ConvexError("Please select an active student.");
      }
      studentId = student.studentId;
      studentName = student.name;
    } else {
      // Backward-compatible fallback for older/internal callers that do not
      // yet provide a stable student id.
      const normalizedName = normalizeName(args.studentName);
      const students = await ctx.db.query("students").collect();
      const matchingStudents = students.filter(
        (student) => normalizeName(student.name) === normalizedName,
      );
      studentId =
        matchingStudents.length === 1
          ? matchingStudents[0].studentId
          : undefined;
    }

    const classNumber = studentId
      ? await computeNextClassNumber(ctx, studentId)
      : undefined;

    return await ctx.db.insert("reviews", {
      ...reviewFields,
      studentId,
      studentName,
      classNumber,
      createdAt: Date.now(),
    });
  },
});

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

async function computeNextClassNumber(
  ctx: QueryCtx | MutationCtx,
  studentId: string,
) {
  const student = await ctx.db
    .query("students")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .unique();
  if (!student) {
    throw new ConvexError("Student not found.");
  }

  // baselineThroughDate includes the full stated calendar date. Reviews must
  // be strictly later than its UTC end-of-day boundary to qualify.
  const baselineEnd = Date.parse(`${student.baselineThroughDate}T23:59:59.999Z`);
  const qualifyingReviews = await ctx.db
    .query("reviews")
    .withIndex("by_studentId_createdAt", (q) =>
      q.eq("studentId", studentId).gt("createdAt", baselineEnd),
    )
    .collect();

  return student.baselineClassesTaken + qualifyingReviews.length + 1;
}

// Permanently remove one saved review. The document id validator ensures this
// mutation can only target a record in the reviews table.
export const remove = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, { reviewId }) => {
    await ctx.db.delete(reviewId);
  },
});
