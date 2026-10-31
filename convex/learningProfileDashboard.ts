import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import {
  getSportCapabilities,
  isSupportedSportName,
  isValidCapabilityKey,
} from "./sportConfig";
import { requireAuthenticatedCoach, requireStudentSportAccess } from "./authorization";

type DashboardCtx = Pick<QueryCtx, "db">;

function compareCreatedAtThenId(left: { createdAt: number; milestoneId: string }, right: { createdAt: number; milestoneId: string }) {
  return left.createdAt - right.createdAt || left.milestoneId.localeCompare(right.milestoneId);
}

function compareAchievedThenId(left: { achievedDate?: string; milestoneId: string }, right: { achievedDate?: string; milestoneId: string }) {
  return (right.achievedDate ?? "").localeCompare(left.achievedDate ?? "") || right.milestoneId.localeCompare(left.milestoneId);
}

export const getStudentLearningProfileDashboard = query({
  args: {
    studentSportId: v.id("studentSports"),
  },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    await requireStudentSportAccess(ctx, coach._id, args.studentSportId);
    return getStudentLearningProfileDashboardData(ctx, args.studentSportId);
  },
});

export async function getStudentLearningProfileDashboardData(
  ctx: DashboardCtx,
  studentSportId: Id<"studentSports">,
) {
  const studentSport = await ctx.db.get(studentSportId);
  if (!studentSport) throw new ConvexError("StudentSport not found.");

  const student = await ctx.db.get(studentSport.studentId);
  if (!student) throw new ConvexError("StudentSport references a missing Student.");

  const sport = await ctx.db.get(studentSport.sportId);
  if (!sport) throw new ConvexError("StudentSport references a missing Sport.");
  if (!isSupportedSportName(sport.name)) {
    throw new ConvexError("Sport is not supported by the capability configuration.");
  }

  const profiles = await ctx.db
    .query("studentLearningProfiles")
    .withIndex("by_studentSport", (q) => q.eq("studentSportId", studentSportId))
    .collect();
  if (profiles.length > 1) {
    throw new ConvexError("Multiple Learning Profiles exist for this StudentSport.");
  }

  const profile = profiles[0];
  const capabilities = getSportCapabilities(sport.name);
  const emptyMilestones = { current: [], next: [], achieved: [] };
  if (!profile) {
    return {
      student: { studentId: student._id, name: student.name },
      sport: { sportId: sport._id, name: sport.name },
      studentSportId,
      profileStatus: "missing" as const,
      learningProfile: null,
      milestones: emptyMilestones,
      capabilities: capabilities.map(({ capabilityKey, label }) => ({
        capabilityKey,
        label,
        rating: null,
        updatedAt: null,
      })),
    };
  }

  const milestones = await ctx.db
    .query("learningMilestones")
    .withIndex("by_profile", (q) => q.eq("learningProfileId", profile._id))
    .collect();
  const presentMilestones = milestones.map((milestone) => ({
    milestoneId: milestone._id,
    milestoneText: milestone.milestoneText,
    status: milestone.status,
    achievedDate: milestone.achievedDate,
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
  }));
  const grouped = {
    current: presentMilestones.filter((milestone) => milestone.status === "current").sort(compareCreatedAtThenId),
    next: presentMilestones.filter((milestone) => milestone.status === "next").sort(compareCreatedAtThenId),
    achieved: presentMilestones.filter((milestone) => milestone.status === "achieved").sort(compareAchievedThenId),
  };

  const ratings = await ctx.db
    .query("capabilityRatings")
    .withIndex("by_profile_key", (q) => q.eq("learningProfileId", profile._id))
    .collect();
  const ratingsByKey = new Map<string, (typeof ratings)[number]>();
  for (const rating of ratings) {
    if (ratingsByKey.has(rating.capabilityKey)) {
      throw new ConvexError("Multiple capability ratings exist for this profile and capability.");
    }
    if (!isValidCapabilityKey(sport.name, rating.capabilityKey)) {
      throw new ConvexError("Stored capability is not valid for this Sport.");
    }
    ratingsByKey.set(rating.capabilityKey, rating);
  }

  return {
    student: { studentId: student._id, name: student.name },
    sport: { sportId: sport._id, name: sport.name },
    studentSportId,
    profileStatus: "ready" as const,
    learningProfile: {
      learningProfileId: profile._id,
      learningGoal: profile.learningGoal,
    },
    milestones: grouped,
    capabilities: capabilities.map(({ capabilityKey, label }) => {
      const rating = ratingsByKey.get(capabilityKey);
      return {
        capabilityKey,
        label,
        rating: rating?.rating ?? null,
        updatedAt: rating?.updatedAt ?? null,
      };
    }),
  };
}
