import { internalMutation, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const TENNIS = "Tennis";
const SKI = "Ski";
const TOM_TAO = "Tom Tao";

type FoundationTable = "sports" | "coaches" | "coachSports";

type CreatedRecord<T extends FoundationTable> = {
  id: Id<T>;
  created: boolean;
};

export type FoundationResult = {
  sports: {
    tennis: CreatedRecord<"sports">;
    ski: CreatedRecord<"sports">;
  };
  coach: CreatedRecord<"coaches">;
  coachSports: {
    tennis: CreatedRecord<"coachSports">;
    ski: CreatedRecord<"coachSports">;
  };
};

export const ensurePlatformFoundationInternal = internalMutation({
  args: {},
  handler: async (ctx) => ensureFoundation(ctx),
});

// Kept as a compatibility symbol for older generated clients, but deliberately
// disabled so initialization cannot be invoked from a browser.
export const ensurePlatformFoundation = mutation({
  args: {},
  handler: async (): Promise<FoundationResult> => {
    throw new Error("Platform foundation initialization is internal-only.");
  },
});

export async function ensureFoundation(
  ctx: Pick<MutationCtx, "db">,
): Promise<FoundationResult> {
  const tennis = await ensureSport(ctx, TENNIS);
  const ski = await ensureSport(ctx, SKI);
  const coach = await ensureCoach(ctx, TOM_TAO);
  const tennisRelationship = await ensureCoachSport(ctx, coach.id, tennis.id);
  const skiRelationship = await ensureCoachSport(ctx, coach.id, ski.id);

  return {
    sports: { tennis, ski },
    coach,
    coachSports: {
      tennis: tennisRelationship,
      ski: skiRelationship,
    },
  };
}

async function ensureSport(ctx: Pick<MutationCtx, "db">, name: string) {
  const existing = await ctx.db
    .query("sports")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  if (existing) return { id: existing._id, created: false };

  const id = await ctx.db.insert("sports", { name, status: "active" });
  return { id, created: true };
}

async function ensureCoach(ctx: Pick<MutationCtx, "db">, name: string) {
  const existing = await ctx.db
    .query("coaches")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  if (existing) return { id: existing._id, created: false };

  const id = await ctx.db.insert("coaches", { name, status: "active" });
  return { id, created: true };
}

async function ensureCoachSport(
  ctx: Pick<MutationCtx, "db">,
  coachId: Id<"coaches">,
  sportId: Id<"sports">,
) {
  const existing = await ctx.db
    .query("coachSports")
    .withIndex("by_coach_sport", (q) =>
      q.eq("coachId", coachId).eq("sportId", sportId),
    )
    .unique();
  if (existing) return { id: existing._id, created: false };

  const id = await ctx.db.insert("coachSports", { coachId, sportId });
  return { id, created: true };
}
