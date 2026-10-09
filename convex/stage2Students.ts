import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { ensureLearningProfile } from "./learningProfiles";

type StudentSportResult = {
  id: Id<"studentSports">;
  created: boolean;
  sequenceBaseline: number;
  stage2StartedAt: number;
  learningProfileId: Id<"studentLearningProfiles">;
};

function isActiveStudent(status: "Active" | "Inactive" | "active" | "inactive") {
  return status === "Active" || status === "active";
}

function hasStage1History(student: {
  studentId?: string;
  startDate?: string;
  baselineClassesTaken?: number;
  baselineThroughDate?: string;
}) {
  return (
    student.studentId !== undefined ||
    student.startDate !== undefined ||
    student.baselineClassesTaken !== undefined ||
    student.baselineThroughDate !== undefined
  );
}

async function loadActiveSport(ctx: Pick<MutationCtx, "db">, sportId: Id<"sports">) {
  const sport = await ctx.db.get(sportId);
  if (!sport) throw new ConvexError("Sport not found.");
  if (sport.status !== "active") {
    throw new ConvexError("Sport is inactive.");
  }
  return sport;
}

async function enrollNativeStudentSport(
  ctx: Pick<MutationCtx, "db">,
  studentId: Id<"students">,
  sportId: Id<"sports">,
  sportName: string,
): Promise<StudentSportResult> {
  const existing = await ctx.db
    .query("studentSports")
    .withIndex("by_student_sport", (q) =>
      q.eq("studentId", studentId).eq("sportId", sportId),
    )
    .unique();
  if (existing) {
    if (existing.stage2StartedAt === undefined) {
      throw new ConvexError("StudentSport is not fully initialized.");
    }
    const learningProfileId = await ensureLearningProfile(ctx, existing._id);
    return {
      id: existing._id,
      created: false,
      sequenceBaseline: existing.sequenceBaseline,
      stage2StartedAt: existing.stage2StartedAt,
      learningProfileId,
    };
  }

  const student = await ctx.db.get(studentId);
  if (!student) throw new ConvexError("Student not found.");
  if (!isActiveStudent(student.status)) {
    throw new ConvexError("Student is inactive.");
  }
  if (sportName === "Tennis" && hasStage1History(student)) {
    throw new ConvexError(
      "This Tennis student requires the Stage 1 cutover flow.",
    );
  }

  const stage2StartedAt = Date.now();
  const id = await ctx.db.insert("studentSports", {
    studentId,
    sportId,
    sequenceBaseline: 0,
    stage2StartedAt,
  });
  const learningProfileId = await ensureLearningProfile(ctx, id);
  return { id, created: true, sequenceBaseline: 0, stage2StartedAt, learningProfileId };
}

export const createStage2Student = mutation({
  args: {
    name: v.string(),
    sportId: v.id("sports"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => createStage2StudentData(ctx, args),
});

export async function createStage2StudentData(
  ctx: Pick<MutationCtx, "db">,
  args: { name: string; sportId: Id<"sports">; notes?: string },
) {
    const name = args.name.trim();
    if (!name) throw new ConvexError("Student name is required.");
    const sport = await loadActiveSport(ctx, args.sportId);
    const studentId = await ctx.db.insert("students", {
      name,
      status: "active",
      ...(args.notes?.trim() ? { notes: args.notes.trim() } : {}),
    });
    const studentSport = await enrollNativeStudentSport(
      ctx,
      studentId,
      args.sportId,
      sport.name,
    );
    return { studentId, studentSport };
}

export const enrollStudentInSport = mutation({
  args: {
    studentId: v.id("students"),
    sportId: v.id("sports"),
  },
  handler: async (ctx, args) => enrollStudentInSportData(ctx, args),
});

export async function enrollStudentInSportData(
  ctx: Pick<MutationCtx, "db">,
  args: { studentId: Id<"students">; sportId: Id<"sports"> },
) {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new ConvexError("Student not found.");
    if (!isActiveStudent(student.status)) {
      throw new ConvexError("Student is inactive.");
    }
    const sport = await loadActiveSport(ctx, args.sportId);
    return enrollNativeStudentSport(ctx, args.studentId, args.sportId, sport.name);
}
