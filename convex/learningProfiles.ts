import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

export async function ensureLearningProfile(
  ctx: Pick<MutationCtx, "db">,
  studentSportId: Id<"studentSports">,
): Promise<Id<"studentLearningProfiles">> {
  const profiles = await ctx.db
    .query("studentLearningProfiles")
    .withIndex("by_studentSport", (q) => q.eq("studentSportId", studentSportId))
    .collect();

  if (profiles.length > 1) {
    throw new ConvexError(
      "Multiple Learning Profiles exist for this StudentSport.",
    );
  }
  if (profiles.length === 1) return profiles[0]._id;

  const studentSport = await ctx.db.get(studentSportId);
  if (!studentSport) throw new ConvexError("StudentSport not found.");

  return ctx.db.insert("studentLearningProfiles", {
    studentSportId,
    updatedAt: Date.now(),
  });
}
