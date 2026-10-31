import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { requireAuthenticatedCoach, requireStudentAccess } from "./authorization";

export const copyLegacyReview = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const source = await ctx.db.get(args.reviewId);
    if (!source?.studentId) throw new ConvexError("Review access denied.");
    const student = await ctx.db.query("students").withIndex("by_studentId", (q) => q.eq("studentId", source.studentId!)).unique();
    if (!student) throw new ConvexError("Student access denied.");
    await requireStudentAccess(ctx, coach._id, student._id);
    return copyLegacyReviewData(ctx, args.reviewId);
  },
});

export async function copyLegacyReviewData(
  ctx: Pick<MutationCtx, "db">,
  reviewId: Id<"reviews">,
) {
  const source = await ctx.db.get(reviewId);
  if (!source) throw new ConvexError("Source review not found.");

  const legacyReviewId = String(reviewId);
  const existing = await ctx.db
    .query("legacyStage1Reviews")
    .withIndex("by_legacyReviewId", (q) => q.eq("legacyReviewId", legacyReviewId))
    .unique();
  if (existing) {
    return {
      legacyReviewId,
      created: false,
      legacyReviewIdDocumentId: existing._id,
    };
  }

  const studentId = await resolveStudentId(ctx, source.studentId, source.studentName);
  const legacyReviewIdDocumentId = await ctx.db.insert("legacyStage1Reviews", {
    legacyReviewId,
    ...(studentId ? { studentId } : {}),
    studentName: source.studentName,
    ...(source.classNumber === undefined
      ? {}
      : { classNumber: source.classNumber }),
    whatWeDid: source.whatWeDid,
    progress: source.progress,
    nextSteps: source.nextSteps,
    message: source.message,
    createdAt: source.createdAt,
    sourceTable: "reviews",
    migratedAt: Date.now(),
  });

  return {
    legacyReviewId,
    created: true,
    legacyReviewIdDocumentId,
  };
}

async function resolveStudentId(
  ctx: Pick<MutationCtx, "db">,
  sourceStudentId: string | undefined,
  studentName: string,
): Promise<Id<"students"> | undefined> {
  if (sourceStudentId) {
    const student = await ctx.db
      .query("students")
      .withIndex("by_studentId", (q) => q.eq("studentId", sourceStudentId))
      .unique();
    return student?._id;
  }

  const normalizedName = normalizeName(studentName);
  const students = await ctx.db.query("students").collect();
  const matches = students.filter(
    (student) => normalizeName(student.name) === normalizedName,
  );
  return matches.length === 1 ? matches[0]._id : undefined;
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}
