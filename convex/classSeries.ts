import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { requireAuthenticatedCoach, requireClassSeriesAccess, requireCoachSportAccess } from "./authorization";

type SeriesArgs = {
  coachId: Id<"coaches">;
  sportId: Id<"sports">;
  studentIds: Id<"students">[];
  usualDayOfWeek?: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  usualStartTime?: string;
  usualEndTime?: string;
};

const weekday = v.union(
  v.literal("Monday"), v.literal("Tuesday"), v.literal("Wednesday"),
  v.literal("Thursday"), v.literal("Friday"), v.literal("Saturday"),
  v.literal("Sunday"),
);

function isActive(status: "Active" | "Inactive" | "active" | "inactive") {
  return status === "Active" || status === "active";
}

function normalizedStudentIds(studentIds: Id<"students">[]) {
  return [...new Set(studentIds)].sort();
}

function sameSet(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

async function validateSeriesInputs(
  ctx: Pick<MutationCtx, "db">,
  coachId: Id<"coaches">,
  sportId: Id<"sports">,
  studentIds: Id<"students">[],
) {
  const coach = await ctx.db.get(coachId);
  if (!coach) throw new ConvexError("Coach not found.");
  if (!isActive(coach.status)) throw new ConvexError("Coach is inactive.");

  const sport = await ctx.db.get(sportId);
  if (!sport) throw new ConvexError("Sport not found.");
  if (sport.status !== "active") throw new ConvexError("Sport is inactive.");

  const coachSport = await ctx.db
    .query("coachSports")
    .withIndex("by_coach_sport", (q) => q.eq("coachId", coachId).eq("sportId", sportId))
    .unique();
  if (!coachSport) throw new ConvexError("Coach is not configured for this Sport.");
  if (studentIds.length === 0) throw new ConvexError("At least one Student is required.");

  for (const studentId of studentIds) {
    const student = await ctx.db.get(studentId);
    if (!student) throw new ConvexError("Student not found.");
    if (!isActive(student.status)) throw new ConvexError("Student is inactive.");

    const studentSport = await ctx.db
      .query("studentSports")
      .withIndex("by_student_sport", (q) => q.eq("studentId", studentId).eq("sportId", sportId))
      .unique();
    if (!studentSport) throw new ConvexError("Student is not enrolled in this Sport.");
    if (studentSport.stage2StartedAt === undefined) {
      throw new ConvexError("Student's Sport enrollment has not started Stage 2.");
    }
  }
}

async function findActiveDuplicate(
  ctx: Pick<MutationCtx, "db">,
  coachId: Id<"coaches">,
  sportId: Id<"sports">,
  studentIds: Id<"students">[],
) {
  const series = await ctx.db
    .query("classSeries")
    .withIndex("by_coach_sport_status", (q) =>
      q.eq("coachId", coachId).eq("sportId", sportId).eq("status", "active"),
    )
    .collect();
  const expected = normalizedStudentIds(studentIds);
  for (const candidate of series) {
    const memberships = await ctx.db
      .query("classSeriesStudents")
      .withIndex("by_classSeries", (q) => q.eq("classSeriesId", candidate._id))
      .collect();
    if (sameSet(normalizedStudentIds(memberships.map((row) => row.studentId)), expected)) {
      return candidate;
    }
  }
  return undefined;
}

async function createSeriesRecords(
  ctx: Pick<MutationCtx, "db">,
  args: Omit<SeriesArgs, "studentIds"> & { studentIds: Id<"students">[] },
) {
  const classSeriesId = await ctx.db.insert("classSeries", {
    coachId: args.coachId,
    sportId: args.sportId,
    status: "active",
    ...(args.usualDayOfWeek ? { usualDayOfWeek: args.usualDayOfWeek } : {}),
    ...(args.usualStartTime ? { usualStartTime: args.usualStartTime } : {}),
    ...(args.usualEndTime ? { usualEndTime: args.usualEndTime } : {}),
  });
  for (const studentId of normalizedStudentIds(args.studentIds)) {
    await ctx.db.insert("classSeriesStudents", { classSeriesId, studentId });
  }
  return classSeriesId;
}

export const createClassSeries = mutation({
  args: {
    coachId: v.id("coaches"),
    sportId: v.id("sports"),
    studentIds: v.array(v.id("students")),
    usualDayOfWeek: v.optional(weekday),
    usualStartTime: v.optional(v.string()),
    usualEndTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    await requireCoachSportAccess(ctx, coach._id, args.sportId);
    return createClassSeriesData(ctx, { ...args, coachId: coach._id });
  },
});

export async function createClassSeriesData(ctx: Pick<MutationCtx, "db">, args: SeriesArgs) {
  const studentIds = normalizedStudentIds(args.studentIds);
  if (studentIds.length !== args.studentIds.length) {
    throw new ConvexError("Duplicate Student IDs are not allowed.");
  }
  await validateSeriesInputs(ctx, args.coachId, args.sportId, studentIds);
  const duplicate = await findActiveDuplicate(ctx, args.coachId, args.sportId, studentIds);
  if (duplicate) throw new ConvexError("An active ClassSeries with this membership already exists.");
  const classSeriesId = await createSeriesRecords(ctx, { ...args, studentIds });
  return { classSeriesId, created: true };
}

export const updateClassSeries = mutation({
  args: {
    classSeriesId: v.id("classSeries"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    usualDayOfWeek: v.optional(weekday),
    usualStartTime: v.optional(v.string()),
    usualEndTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const series = await requireClassSeriesAccess(ctx, coach._id, args.classSeriesId);
    if (!series) throw new ConvexError("ClassSeries not found.");
    await ctx.db.patch(args.classSeriesId, {
      ...(args.status === undefined ? {} : { status: args.status }),
      ...(args.usualDayOfWeek === undefined ? {} : { usualDayOfWeek: args.usualDayOfWeek }),
      ...(args.usualStartTime === undefined ? {} : { usualStartTime: args.usualStartTime }),
      ...(args.usualEndTime === undefined ? {} : { usualEndTime: args.usualEndTime }),
    });
    return { classSeriesId: args.classSeriesId };
  },
});

export const changeClassSeriesMembership = mutation({
  args: {
    classSeriesId: v.id("classSeries"),
    studentIds: v.array(v.id("students")),
  },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    await requireClassSeriesAccess(ctx, coach._id, args.classSeriesId);
    return changeClassSeriesMembershipData(ctx, args);
  },
});

export async function changeClassSeriesMembershipData(
  ctx: Pick<MutationCtx, "db">,
  args: { classSeriesId: Id<"classSeries">; studentIds: Id<"students">[] },
) {
  const series = await ctx.db.get(args.classSeriesId);
  if (!series) throw new ConvexError("ClassSeries not found.");
  const studentIds = normalizedStudentIds(args.studentIds);
  if (studentIds.length === 0 || studentIds.length !== args.studentIds.length) {
    throw new ConvexError("Membership must contain unique Students.");
  }
  await validateSeriesInputs(ctx, series.coachId, series.sportId, studentIds);

  const sessions = await ctx.db
    .query("classSessions")
    .withIndex("by_series_sequence", (q) => q.eq("classSeriesId", args.classSeriesId))
    .collect();
  const duplicate = await findActiveDuplicate(ctx, series.coachId, series.sportId, studentIds);
  if (sessions.length === 0) {
    if (duplicate && duplicate._id !== args.classSeriesId) {
      throw new ConvexError("An active ClassSeries with this membership already exists.");
    }
    const oldMemberships = await ctx.db
      .query("classSeriesStudents")
      .withIndex("by_classSeries", (q) => q.eq("classSeriesId", args.classSeriesId))
      .collect();
    for (const membership of oldMemberships) await ctx.db.delete(membership._id);
    for (const studentId of studentIds) {
      await ctx.db.insert("classSeriesStudents", {
        classSeriesId: args.classSeriesId,
        studentId,
      });
    }
    return { classSeriesId: args.classSeriesId, created: false, correctedInPlace: true };
  }

  if (duplicate) {
    return { classSeriesId: duplicate._id, created: false, correctedInPlace: false };
  }
  await ctx.db.patch(args.classSeriesId, { status: "inactive" });
  const newClassSeriesId = await createSeriesRecords(ctx, {
    coachId: series.coachId,
    sportId: series.sportId,
    studentIds,
  });
  return { classSeriesId: newClassSeriesId, created: true, correctedInPlace: false };
}
