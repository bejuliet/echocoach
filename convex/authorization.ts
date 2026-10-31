import { ConvexError } from "convex/values";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type AuthenticatedIdentity = { subject?: string; issuer?: string };
type DatabaseCtx = Pick<QueryCtx, "db">;
type AuthCtx = Pick<QueryCtx | MutationCtx | ActionCtx, "auth">;

export async function resolveCoachForIdentity(
  ctx: DatabaseCtx,
  identity: AuthenticatedIdentity | null,
) {
  const subject = identity?.subject?.trim();
  if (!subject) throw new ConvexError("Authentication required.");

  const matches = await ctx.db
    .query("coaches")
    .withIndex("by_externalUserId", (q) => q.eq("externalUserId", subject))
    .collect();
  if (matches.length !== 1) {
    throw new ConvexError(matches.length === 0 ? "Coach identity is not registered." : "Coach identity is ambiguous.");
  }
  const coach = matches[0];
  if (coach.status !== "active") throw new ConvexError("Coach account is inactive.");
  return coach;
}

export async function requireAuthenticatedCoach(ctx: AuthCtx & DatabaseCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return resolveCoachForIdentity(ctx, identity);
}

export async function requireAuthenticatedIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject?.trim()) throw new ConvexError("Authentication required.");
  return identity;
}

export async function requireStudentSportAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  studentSportId: Id<"studentSports">,
) {
  const studentSport = await ctx.db.get(studentSportId);
  if (!studentSport) throw new ConvexError("Student Sport access denied.");
  await requireCoachSportAccess(ctx, coachId, studentSport.sportId);
  return requireStudentAccess(ctx, coachId, studentSport.studentId);
}

export async function requireLearningProfileAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  learningProfileId: Id<"studentLearningProfiles">,
) {
  const profile = await ctx.db.get(learningProfileId);
  if (!profile) throw new ConvexError("Learning Profile access denied.");
  await requireStudentSportAccess(ctx, coachId, profile.studentSportId);
  return profile;
}

export async function requireMilestoneAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  milestoneId: Id<"learningMilestones">,
) {
  const milestone = await ctx.db.get(milestoneId);
  if (!milestone) throw new ConvexError("Learning Milestone access denied.");
  await requireLearningProfileAccess(ctx, coachId, milestone.learningProfileId);
  return milestone;
}

export async function requireClassSeriesAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  classSeriesId: Id<"classSeries">,
) {
  const series = await ctx.db.get(classSeriesId);
  if (!series) throw new ConvexError("ClassSeries access denied.");
  await requireCoachSportAccess(ctx, coachId, series.sportId);
  return series;
}

export async function requireCoachSportAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  sportId: Id<"sports">,
) {
  const sport = await ctx.db.get(sportId);
  if (!sport || sport.status !== "active") throw new ConvexError("Sport access denied.");
  const relationship = await ctx.db
    .query("coachSports")
    .withIndex("by_coach_sport", (q) => q.eq("coachId", coachId).eq("sportId", sportId))
    .unique();
  if (!relationship) throw new ConvexError("Sport access denied.");
  return sport;
}

export async function requireStudentAccess(
  ctx: DatabaseCtx,
  coachId: Id<"coaches">,
  studentId: Id<"students">,
) {
  const student = await ctx.db.get(studentId);
  if (!student) throw new ConvexError("Student access denied.");
  const enrollments = await ctx.db
    .query("studentSports")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect();
  for (const enrollment of enrollments) {
    const relationship = await ctx.db
      .query("coachSports")
      .withIndex("by_coach_sport", (q) =>
        q.eq("coachId", coachId).eq("sportId", enrollment.sportId),
      )
      .unique();
    if (relationship) return student;
  }
  throw new ConvexError("Student access denied.");
}
