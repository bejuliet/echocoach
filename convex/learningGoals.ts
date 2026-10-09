import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";

const milestoneStatus = v.union(
  v.literal("next"),
  v.literal("current"),
  v.literal("achieved"),
);

type Status = "next" | "current" | "achieved";

function validateCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateMilestoneState(status: Status, achievedDate: string | undefined) {
  if (status === "achieved" && achievedDate === undefined) {
    throw new ConvexError("Achieved milestones require an achievedDate.");
  }
  if (status !== "achieved" && achievedDate !== undefined) {
    throw new ConvexError("Only achieved milestones may have an achievedDate.");
  }
  if (achievedDate !== undefined && !validateCalendarDate(achievedDate)) {
    throw new ConvexError("achievedDate must be a valid YYYY-MM-DD date.");
  }
}

async function getProfile(ctx: Pick<MutationCtx, "db">, id: Id<"studentLearningProfiles">) {
  const profile = await ctx.db.get(id);
  if (!profile) throw new ConvexError("Learning Profile not found.");
  return profile;
}

export const updateLearningGoal = mutation({
  args: {
    learningProfileId: v.id("studentLearningProfiles"),
    learningGoal: v.optional(v.string()),
  },
  handler: async (ctx, args) => updateLearningGoalData(ctx, args),
});

export async function updateLearningGoalData(
  ctx: Pick<MutationCtx, "db">,
  args: { learningProfileId: Id<"studentLearningProfiles">; learningGoal?: string },
) {
    const profile = await getProfile(ctx, args.learningProfileId);
    const effectiveGoal = args.learningGoal?.trim() || undefined;
    if (effectiveGoal === profile.learningGoal) {
      return { learningProfileId: profile._id, learningGoal: profile.learningGoal };
    }
    await ctx.db.patch(profile._id, {
      learningGoal: effectiveGoal,
      updatedAt: Date.now(),
    });
    return { learningProfileId: profile._id, learningGoal: effectiveGoal };
}

export const createLearningMilestone = mutation({
  args: {
    learningProfileId: v.id("studentLearningProfiles"),
    milestoneText: v.string(),
    status: milestoneStatus,
    achievedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => createLearningMilestoneData(ctx, args),
});

export async function createLearningMilestoneData(
  ctx: Pick<MutationCtx, "db">,
  args: {
    learningProfileId: Id<"studentLearningProfiles">;
    milestoneText: string;
    status: Status;
    achievedDate?: string;
  },
) {
    await getProfile(ctx, args.learningProfileId);
    const milestoneText = args.milestoneText.trim();
    if (!milestoneText) throw new ConvexError("Milestone text is required.");
    validateMilestoneState(args.status, args.achievedDate);
    const now = Date.now();
    return ctx.db.insert("learningMilestones", {
      learningProfileId: args.learningProfileId,
      milestoneText,
      status: args.status,
      ...(args.achievedDate === undefined ? {} : { achievedDate: args.achievedDate }),
      createdAt: now,
      updatedAt: now,
    });
}

export const updateLearningMilestone = mutation({
  args: {
    milestoneId: v.id("learningMilestones"),
    milestoneText: v.optional(v.string()),
    status: v.optional(milestoneStatus),
    achievedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => updateLearningMilestoneData(ctx, args),
});

export async function updateLearningMilestoneData(
  ctx: Pick<MutationCtx, "db">,
  args: {
    milestoneId: Id<"learningMilestones">;
    milestoneText?: string;
    status?: Status;
    achievedDate?: string;
  },
) {
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) throw new ConvexError("Learning Milestone not found.");

    const status = args.status ?? milestone.status;
    const milestoneText = args.milestoneText === undefined
      ? milestone.milestoneText
      : args.milestoneText.trim();
    if (!milestoneText) throw new ConvexError("Milestone text is required.");

    const achievedDate = status === "achieved"
      ? args.achievedDate ?? milestone.achievedDate
      : undefined;
    validateMilestoneState(status, achievedDate);

    const changed =
      milestoneText !== milestone.milestoneText ||
      status !== milestone.status ||
      achievedDate !== milestone.achievedDate;
    if (!changed) {
      return { milestoneId: milestone._id, updated: false };
    }

    await ctx.db.patch(milestone._id, {
      milestoneText,
      status,
      ...(achievedDate === undefined ? { achievedDate: undefined } : { achievedDate }),
      updatedAt: Date.now(),
    });
    return { milestoneId: milestone._id, updated: true };
}
