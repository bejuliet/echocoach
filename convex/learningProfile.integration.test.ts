import { ConvexHttpClient } from "convex/browser";
import { beforeAll, describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SPORT_CAPABILITIES } from "./sportConfig";

type IntegrationFixture = {
  client: ConvexHttpClient;
  tennisSportId: Id<"sports">;
  skiSportId: Id<"sports">;
  studentId: Id<"students">;
  tennisStudentSportId: Id<"studentSports">;
  tennisProfileId: Id<"studentLearningProfiles">;
  skiStudentSportId: Id<"studentSports">;
  skiProfileId: Id<"studentLearningProfiles">;
};

let fixture: IntegrationFixture;

async function expectRejected(operation: Promise<unknown>) {
  await expect(operation).rejects.toBeDefined();
}

describe.sequential("LP-F2E Learning Profile integration", () => {
  beforeAll(async () => {
    const { verifyIntegrationTarget } = await import("../scripts/integration-safety.mjs");
    const target = await verifyIntegrationTarget();
    const client = new ConvexHttpClient(target.url);
    const foundation = await client.mutation(api.platformFoundation.ensurePlatformFoundation, {});
    const tennisSportId = foundation.sports.tennis.id;
    const skiSportId = foundation.sports.ski.id;
    const created = await client.mutation(api.stage2Students.createStage2Student, {
      name: `LP-F2E ${Date.now()} Synthetic Student`,
      sportId: tennisSportId,
      notes: "Automated integration test record",
    });
    const ski = await client.mutation(api.stage2Students.enrollStudentInSport, {
      studentId: created.studentId,
      sportId: skiSportId,
    });
    fixture = {
      client,
      tennisSportId,
      skiSportId,
      studentId: created.studentId,
      tennisStudentSportId: created.studentSport.id,
      tennisProfileId: created.studentSport.learningProfileId,
      skiStudentSportId: ski.id,
      skiProfileId: ski.learningProfileId,
    };
  });

  test("F2-1 automatic profile creation", async () => {
    const dashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(dashboard.profileStatus).toBe("ready");
    expect(dashboard.learningProfile?.learningProfileId).toBe(fixture.tennisProfileId);
  });

  test("F2-2 enrollment and profile creation are idempotent", async () => {
    const repeated = await fixture.client.mutation(api.stage2Students.enrollStudentInSport, {
      studentId: fixture.studentId,
      sportId: fixture.tennisSportId,
    });
    expect(repeated.created).toBe(false);
    expect(repeated.id).toBe(fixture.tennisStudentSportId);
    expect(repeated.learningProfileId).toBe(fixture.tennisProfileId);
  });

  test("F2-3 learning goal create, update, no-op, and clear", async () => {
    const first = await fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: fixture.tennisProfileId,
      learningGoal: "  Improve serve  ",
    });
    expect(first.learningGoal).toBe("Improve serve");
    const beforeNoOp = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    const same = await fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: fixture.tennisProfileId,
      learningGoal: "Improve serve",
    });
    expect(same.learningGoal).toBe("Improve serve");
    const afterNoOp = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(afterNoOp.learningProfile).toEqual(beforeNoOp.learningProfile);
    const cleared = await fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: fixture.tennisProfileId,
    });
    expect(cleared.learningGoal).toBeUndefined();
  });

  test("F2-4 multiple current and next milestones coexist", async () => {
    for (const [text, status] of [["Build rally", "current"], ["Improve placement", "current"], ["Enter match play", "next"], ["Serve under pressure", "next"]] as const) {
      await fixture.client.mutation(api.learningGoals.createLearningMilestone, {
        learningProfileId: fixture.tennisProfileId,
        milestoneText: text,
        status,
      });
    }
    const dashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(dashboard.milestones.current).toHaveLength(2);
    expect(dashboard.milestones.next).toHaveLength(2);
  });

  test("F2-5 milestone transitions validate and clear achievedDate", async () => {
    const milestoneId = await fixture.client.mutation(api.learningGoals.createLearningMilestone, {
      learningProfileId: fixture.tennisProfileId,
      milestoneText: "Complete assessment",
      status: "current",
    });
    const beforeFailedTransition = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    await expectRejected(fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId, status: "achieved",
    }));
    await expectRejected(fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId, status: "achieved", achievedDate: "2026-02-31",
    }));
    const afterFailedTransition = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(afterFailedTransition.milestones).toEqual(beforeFailedTransition.milestones);
    await fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId, status: "achieved", achievedDate: "2026-10-09",
    });
    await fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId, status: "current", achievedDate: "2026-10-09",
    });
    const transitioned = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    const currentMilestone = transitioned.milestones.current.find((m) => m.milestoneId === milestoneId);
    expect(currentMilestone?.achievedDate).toBeUndefined();
    const updatedAt = currentMilestone?.updatedAt;
    await fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId, status: "current",
    });
    const afterNoOp = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(afterNoOp.milestones.current.find((m) => m.milestoneId === milestoneId)?.updatedAt).toBe(updatedAt);
  });

  test("F2-6 capability ratings create, overwrite, validate, and clear", async () => {
    const first = await fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "serve", rating: 3,
    });
    const second = await fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "serve", rating: 4,
    });
    expect(second.capabilityRatingId).toBe(first.capabilityRatingId);
    for (const rating of [0, 6, 1.5]) {
      await expectRejected(fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
        learningProfileId: fixture.tennisProfileId, capabilityKey: "serve", rating,
      }));
    }
    expect((await fixture.client.mutation(api.capabilityRatings.clearCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "serve",
    })).cleared).toBe(true);
    expect((await fixture.client.mutation(api.capabilityRatings.clearCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "serve",
    })).cleared).toBe(false);
  });

  test("F2-7 dashboard returns the persisted profile view", async () => {
    await fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: fixture.tennisProfileId, learningGoal: "Improve footwork",
    });
    const dashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(dashboard.student.studentId).toBe(fixture.studentId);
    expect(dashboard.sport.name).toBe("Tennis");
    expect(dashboard.profileStatus).toBe("ready");
    expect(dashboard.learningProfile?.learningGoal).toBe("Improve footwork");
    expect(dashboard.milestones.current.length).toBeGreaterThan(0);
    expect(dashboard.studentSportId).toBe(fixture.tennisStudentSportId);
    expect(dashboard.milestones.current.length).toBeGreaterThan(0);
    expect(dashboard.capabilities).toEqual(SPORT_CAPABILITIES.Tennis.map(({ capabilityKey, label }) => ({
      capabilityKey, label, rating: null, updatedAt: null,
    })));
    await fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: fixture.skiProfileId, learningGoal: "Build confidence on varied terrain",
    });
    const skiDashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.skiStudentSportId,
    });
    expect(skiDashboard.student.studentId).toBe(fixture.studentId);
    expect(skiDashboard.sport.name).toBe("Ski");
    expect(skiDashboard.studentSportId).toBe(fixture.skiStudentSportId);
    expect(skiDashboard.profileStatus).toBe("ready");
    expect(skiDashboard.learningProfile?.learningGoal).toBe("Build confidence on varied terrain");
    expect(skiDashboard.milestones).toEqual({ current: [], next: [], achieved: [] });
    expect(skiDashboard.capabilities).toEqual(SPORT_CAPABILITIES.Ski.map(({ capabilityKey, label }) => ({
      capabilityKey, label, rating: null, updatedAt: null,
    })));
  });

  test("F2-8 Tennis and Ski configurations remain separate", async () => {
    expect(SPORT_CAPABILITIES.Tennis).toHaveLength(7);
    expect(SPORT_CAPABILITIES.Ski).toHaveLength(6);
    await expectRejected(fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
      learningProfileId: fixture.skiProfileId, capabilityKey: "serve", rating: 3,
    }));
    await expectRejected(fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "turning", rating: 3,
    }));
    const skiDashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.skiStudentSportId,
    });
    expect(skiDashboard.learningProfile?.learningProfileId).toBe(fixture.skiProfileId);
    expect(skiDashboard.capabilities).toHaveLength(6);
  });

  test("F2-9 invalid operations reject without partial changes", async () => {
    const before = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    await expectRejected(fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: "studentSports_invalid" as Id<"studentSports">,
    }));
    await expectRejected(fixture.client.mutation(api.learningGoals.updateLearningGoal, {
      learningProfileId: "studentLearningProfiles_invalid" as Id<"studentLearningProfiles">,
      learningGoal: "must fail",
    }));
    await expectRejected(fixture.client.mutation(api.learningGoals.createLearningMilestone, {
      learningProfileId: fixture.tennisProfileId, milestoneText: "   ", status: "current",
    }));
    await expectRejected(fixture.client.mutation(api.capabilityRatings.updateCapabilityRating, {
      learningProfileId: fixture.tennisProfileId, capabilityKey: "not-a-capability", rating: 3,
    }));
    await expectRejected(fixture.client.mutation(api.learningGoals.updateLearningMilestone, {
      milestoneId: "learningMilestones_invalid" as Id<"learningMilestones">,
      status: "achieved",
    }));
    const dashboard = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    expect(dashboard.profileStatus).toBe("ready");
    expect(dashboard.learningProfile).toEqual(before.learningProfile);
    expect(dashboard.milestones).toEqual(before.milestones);
    expect(dashboard.capabilities).toEqual(before.capabilities);
  });

  test("F2-10 final integrity holds for the run records", async () => {
    const tennis = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.tennisStudentSportId,
    });
    const ski = await fixture.client.query(api.learningProfileDashboard.getStudentLearningProfileDashboard, {
      studentSportId: fixture.skiStudentSportId,
    });
    expect(tennis.learningProfile?.learningProfileId).toBe(fixture.tennisProfileId);
    expect(ski.learningProfile?.learningProfileId).toBe(fixture.skiProfileId);
    expect(tennis.sport.name).not.toBe(ski.sport.name);
    expect(tennis.profileStatus).toBe("ready");
    expect(ski.profileStatus).toBe("ready");
    expect(new Set(tennis.capabilities.map((c) => c.capabilityKey)).size).toBe(7);
    expect(new Set(ski.capabilities.map((c) => c.capabilityKey)).size).toBe(6);
  });
});
