import { describe, expect, it } from "vitest";
import {
  createLearningMilestoneData,
  updateLearningGoalData,
  updateLearningMilestoneData,
} from "./learningGoals";

type TableName = "studentLearningProfiles" | "learningMilestones";
type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    studentLearningProfiles: (seed.studentLearningProfiles ?? []).map((row) => ({ ...row })),
    learningMilestones: (seed.learningMilestones ?? []).map((row) => ({ ...row })),
  };
  let nextId = 1;
  const db = {
    async get(id: string) { return Object.values(rows).flat().find((row) => row._id === id); },
    async insert(table: TableName, value: Record<string, unknown>) {
      const row = { ...value, _id: `${table}_${nextId++}` };
      rows[table].push(row);
      return row._id;
    },
    async patch(id: string, value: Record<string, unknown>) {
      const row = Object.values(rows).flat().find((candidate) => candidate._id === id);
      if (!row) throw new Error("Missing row");
      Object.assign(row, value);
    },
  };
  return { db, rows };
}

const profile = { _id: "profile_1", studentSportId: "ss_1", updatedAt: 100 };

describe("Learning Goal and Milestones", () => {
  it("sets, trims, clears, and no-ops Learning Goal updates", async () => {
    const { db, rows } = makeDb({ studentLearningProfiles: [profile] });
    await updateLearningGoalData({ db } as never, { learningProfileId: profile._id as never, learningGoal: "  Improve serve  " });
    expect(rows.studentLearningProfiles[0]).toMatchObject({ learningGoal: "Improve serve", studentSportId: "ss_1" });
    const updatedAt = rows.studentLearningProfiles[0].updatedAt;
    await updateLearningGoalData({ db } as never, { learningProfileId: profile._id as never, learningGoal: "Improve serve" });
    expect(rows.studentLearningProfiles[0].updatedAt).toBe(updatedAt);
    await updateLearningGoalData({ db } as never, { learningProfileId: profile._id as never, learningGoal: "   " });
    expect(rows.studentLearningProfiles[0].learningGoal).toBeUndefined();
  });

  it("rejects a missing profile", async () => {
    const { db } = makeDb();
    await expect(updateLearningGoalData({ db } as never, { learningProfileId: "missing" as never }))
      .rejects.toThrow("Learning Profile not found");
  });

  it("creates next, current, and achieved milestones, including multiple next/current", async () => {
    const { db, rows } = makeDb({ studentLearningProfiles: [profile] });
    await createLearningMilestoneData({ db } as never, { learningProfileId: profile._id as never, milestoneText: " One ", status: "next" });
    await createLearningMilestoneData({ db } as never, { learningProfileId: profile._id as never, milestoneText: "Two", status: "current" });
    await createLearningMilestoneData({ db } as never, { learningProfileId: profile._id as never, milestoneText: "Three", status: "current" });
    await createLearningMilestoneData({ db } as never, { learningProfileId: profile._id as never, milestoneText: "Four", status: "achieved", achievedDate: "2026-10-08" });
    expect(rows.learningMilestones).toHaveLength(4);
    expect(rows.learningMilestones[0].milestoneText).toBe("One");
  });

  it("validates text, status/date combinations, and calendar dates", async () => {
    const { db } = makeDb({ studentLearningProfiles: [profile] });
    const base = { learningProfileId: profile._id as never };
    await expect(createLearningMilestoneData({ db } as never, { ...base, milestoneText: " ", status: "next" })).rejects.toThrow();
    await expect(createLearningMilestoneData({ db } as never, { ...base, milestoneText: "x", status: "achieved" })).rejects.toThrow();
    await expect(createLearningMilestoneData({ db } as never, { ...base, milestoneText: "x", status: "current", achievedDate: "2026-01-01" })).rejects.toThrow();
    await expect(createLearningMilestoneData({ db } as never, { ...base, milestoneText: "x", status: "achieved", achievedDate: "2026-02-30" })).rejects.toThrow();
  });

  it("updates milestones and clears achievedDate when leaving achieved", async () => {
    const milestone = { _id: "milestone_1", learningProfileId: profile._id, milestoneText: "Serve", status: "achieved", achievedDate: "2026-10-01", createdAt: 10, updatedAt: 20 };
    const { db, rows } = makeDb({ studentLearningProfiles: [profile], learningMilestones: [milestone] });
    await updateLearningMilestoneData({ db } as never, { milestoneId: milestone._id as never, status: "current" });
    expect(rows.learningMilestones[0]).toMatchObject({ _id: milestone._id, createdAt: 10, status: "current" });
    expect(rows.learningMilestones[0].achievedDate).toBeUndefined();
    expect(rows.studentLearningProfiles[0].updatedAt).toBe(100);
  });

  it("requires an explicit date when moving to achieved and permits date correction", async () => {
    const milestone = { _id: "milestone_1", learningProfileId: profile._id, milestoneText: "Serve", status: "current", createdAt: 10, updatedAt: 20 };
    const { db, rows } = makeDb({ studentLearningProfiles: [profile], learningMilestones: [milestone] });
    await expect(updateLearningMilestoneData({ db } as never, { milestoneId: milestone._id as never, status: "achieved" })).rejects.toThrow();
    await updateLearningMilestoneData({ db } as never, { milestoneId: milestone._id as never, status: "achieved", achievedDate: "2026-10-08" });
    await updateLearningMilestoneData({ db } as never, { milestoneId: milestone._id as never, achievedDate: "2026-10-09" });
    expect(rows.learningMilestones[0].achievedDate).toBe("2026-10-09");
  });

  it("preserves updatedAt on a no-op milestone update", async () => {
    const milestone = { _id: "milestone_1", learningProfileId: profile._id, milestoneText: "Serve", status: "current", createdAt: 10, updatedAt: 20 };
    const { db, rows } = makeDb({ learningMilestones: [milestone] });
    const result = await updateLearningMilestoneData({ db } as never, { milestoneId: milestone._id as never });
    expect(result.updated).toBe(false);
    expect(rows.learningMilestones[0].updatedAt).toBe(20);
  });
});
