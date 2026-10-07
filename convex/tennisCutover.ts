import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { calculateStage1SequenceBaseline } from "./reviews";

export const cutoverTennisStudent = mutation({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => cutoverTennisStudentData(ctx, args.studentId),
});

export async function cutoverTennisStudentData(
  ctx: Pick<MutationCtx, "db">,
  studentId: Id<"students">,
) {
  const student = await ctx.db.get(studentId);
  if (!student) throw new ConvexError("Student not found.");
  if (student.status !== "Active" && student.status !== "active") {
    throw new ConvexError("Student is inactive.");
  }
  if (
    student.studentId === undefined ||
    student.baselineClassesTaken === undefined ||
    student.baselineThroughDate === undefined
  ) {
    throw new ConvexError(
      "Student is not configured for Stage 1 Tennis cutover.",
    );
  }

  const tennis = await ctx.db
    .query("sports")
    .withIndex("by_name", (q) => q.eq("name", "Tennis"))
    .unique();
  if (!tennis) throw new ConvexError("Tennis Sport not found.");
  if (tennis.status !== "active") {
    throw new ConvexError("Tennis Sport is inactive.");
  }

  const existing = await ctx.db
    .query("studentSports")
    .withIndex("by_student_sport", (q) =>
      q.eq("studentId", studentId).eq("sportId", tennis._id),
    )
    .unique();
  if (existing) {
    if (existing.stage2StartedAt === undefined) {
      throw new ConvexError(
        "StudentSport exists without a valid Tennis cutover boundary.",
      );
    }
    return {
      studentSportId: existing._id,
      created: false,
      sequenceBaseline: existing.sequenceBaseline,
      stage2StartedAt: existing.stage2StartedAt,
    };
  }

  const sequenceBaseline = await calculateStage1SequenceBaseline(
    ctx,
    student.studentId,
  );
  const stage2StartedAt = Date.now();
  const studentSportId = await ctx.db.insert("studentSports", {
    studentId,
    sportId: tennis._id,
    sequenceBaseline,
    stage2StartedAt,
  });

  return {
    studentSportId,
    created: true,
    sequenceBaseline,
    stage2StartedAt,
  };
}
