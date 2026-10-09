import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { isSupportedSportName, isValidCapabilityKey } from "./sportConfig";

async function resolveCapabilityContext(
  ctx: Pick<MutationCtx, "db">,
  learningProfileId: Id<"studentLearningProfiles">,
  capabilityKey: string,
) {
  const profile = await ctx.db.get(learningProfileId);
  if (!profile) throw new ConvexError("Learning Profile not found.");

  const studentSport = await ctx.db.get(profile.studentSportId);
  if (!studentSport) throw new ConvexError("StudentSport not found.");

  const sport = await ctx.db.get(studentSport.sportId);
  if (!sport) throw new ConvexError("Sport not found.");
  if (!isSupportedSportName(sport.name)) {
    throw new ConvexError("Sport is not supported by the capability configuration.");
  }
  if (!isValidCapabilityKey(sport.name, capabilityKey)) {
    throw new ConvexError("Capability is not valid for this Sport.");
  }

  return { profile, studentSport, sport };
}

function validateRating(rating: number) {
  if (!Number.isFinite(rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ConvexError("Rating must be an integer from 1 through 5.");
  }
}

export const updateCapabilityRating = mutation({
  args: {
    learningProfileId: v.id("studentLearningProfiles"),
    capabilityKey: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => updateCapabilityRatingData(ctx, args),
});

export async function updateCapabilityRatingData(
  ctx: Pick<MutationCtx, "db">,
  args: {
    learningProfileId: Id<"studentLearningProfiles">;
    capabilityKey: string;
    rating: number;
  },
) {
  await resolveCapabilityContext(ctx, args.learningProfileId, args.capabilityKey);
  validateRating(args.rating);

  const ratings = await ctx.db
    .query("capabilityRatings")
    .withIndex("by_profile_key", (q) =>
      q.eq("learningProfileId", args.learningProfileId).eq("capabilityKey", args.capabilityKey),
    )
    .collect();
  if (ratings.length > 1) {
    throw new ConvexError("Multiple capability ratings exist for this profile and capability.");
  }

  if (ratings.length === 1) {
    const existing = ratings[0];
    if (existing.rating === args.rating) {
      return {
        capabilityRatingId: existing._id,
        learningProfileId: args.learningProfileId,
        capabilityKey: args.capabilityKey,
        rating: existing.rating,
      };
    }
    await ctx.db.patch(existing._id, { rating: args.rating, updatedAt: Date.now() });
    return {
      capabilityRatingId: existing._id,
      learningProfileId: args.learningProfileId,
      capabilityKey: args.capabilityKey,
      rating: args.rating,
    };
  }

  const capabilityRatingId = await ctx.db.insert("capabilityRatings", {
    learningProfileId: args.learningProfileId,
    capabilityKey: args.capabilityKey,
    rating: args.rating,
    updatedAt: Date.now(),
  });
  return {
    capabilityRatingId,
    learningProfileId: args.learningProfileId,
    capabilityKey: args.capabilityKey,
    rating: args.rating,
  };
}

export const clearCapabilityRating = mutation({
  args: {
    learningProfileId: v.id("studentLearningProfiles"),
    capabilityKey: v.string(),
  },
  handler: async (ctx, args) => clearCapabilityRatingData(ctx, args),
});

export async function clearCapabilityRatingData(
  ctx: Pick<MutationCtx, "db">,
  args: {
    learningProfileId: Id<"studentLearningProfiles">;
    capabilityKey: string;
  },
) {
  await resolveCapabilityContext(ctx, args.learningProfileId, args.capabilityKey);
  const ratings = await ctx.db
    .query("capabilityRatings")
    .withIndex("by_profile_key", (q) =>
      q.eq("learningProfileId", args.learningProfileId).eq("capabilityKey", args.capabilityKey),
    )
    .collect();
  if (ratings.length > 1) {
    throw new ConvexError("Multiple capability ratings exist for this profile and capability.");
  }
  if (ratings.length === 0) {
    return { learningProfileId: args.learningProfileId, capabilityKey: args.capabilityKey, cleared: false };
  }
  await ctx.db.delete(ratings[0]._id);
  return { learningProfileId: args.learningProfileId, capabilityKey: args.capabilityKey, cleared: true };
}
