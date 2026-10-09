import { describe, expect, it } from "vitest";
import { getStudentLearningProfileDashboardData } from "./learningProfileDashboard";
import { SPORT_CAPABILITIES } from "./sportConfig";

type TableName = "studentSports" | "students" | "sports" | "studentLearningProfiles" | "learningMilestones" | "capabilityRatings";
type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    studentSports: seed.studentSports ?? [], students: seed.students ?? [], sports: seed.sports ?? [],
    studentLearningProfiles: seed.studentLearningProfiles ?? [], learningMilestones: seed.learningMilestones ?? [],
    capabilityRatings: seed.capabilityRatings ?? [],
  };
  let writes = 0;
  const db = {
    async get(id: string) { return Object.values(rows).flat().find((row) => row._id === id); },
    query(table: TableName) {
      const filters: Record<string, unknown> = {};
      const chain = {
        withIndex(_name: string, callback: (q: { eq: (name: string, value: unknown) => unknown }) => void) {
          callback({ eq(name: string, value: unknown) { filters[name] = value; return this; } });
          return chain;
        },
        async collect() { return rows[table].filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value)); },
      };
      return chain;
    },
    async insert() { writes += 1; throw new Error("Dashboard query attempted a write"); },
    async patch() { writes += 1; throw new Error("Dashboard query attempted a write"); },
    async delete() { writes += 1; throw new Error("Dashboard query attempted a write"); },
  };
  return { db, rows, getWrites: () => writes };
}

const student = { _id: "student_1", name: "Harper", status: "active" };
const tennis = { _id: "sport_tennis", name: "Tennis", status: "active" };
const studentSport = { _id: "studentSport_1", studentId: student._id, sportId: tennis._id, sequenceBaseline: 10, stage2StartedAt: 123 };
const profile = { _id: "profile_1", studentSportId: studentSport._id, learningGoal: "Serve consistency", updatedAt: 100 };

function base(extra: Partial<Record<TableName, Row[]>> = {}) {
  return {
    studentSports: [studentSport], students: [student], sports: [tennis], studentLearningProfiles: [profile],
    learningMilestones: [], capabilityRatings: [], ...extra,
  };
}

describe("Student Learning Profile dashboard query", () => {
  it("returns a populated Tennis profile in configuration order", async () => {
    const { db } = makeDb(base({
      learningMilestones: [
        { _id: "m1", learningProfileId: profile._id, milestoneText: "Current 1", status: "current", createdAt: 2, updatedAt: 2 },
        { _id: "m2", learningProfileId: profile._id, milestoneText: "Current 2", status: "current", createdAt: 1, updatedAt: 1 },
        { _id: "m3", learningProfileId: profile._id, milestoneText: "Achieved old", status: "achieved", achievedDate: "2026-01-01", createdAt: 1, updatedAt: 1 },
        { _id: "m4", learningProfileId: profile._id, milestoneText: "Achieved new", status: "achieved", achievedDate: "2026-02-01", createdAt: 1, updatedAt: 1 },
      ],
      capabilityRatings: [{ _id: "r1", learningProfileId: profile._id, capabilityKey: "serve", rating: 3, updatedAt: 50 }],
    }));
    const result = await getStudentLearningProfileDashboardData({ db } as never, studentSport._id as never);
    expect(result.profileStatus).toBe("ready");
    expect(result.learningProfile?.learningGoal).toBe("Serve consistency");
    expect(result.milestones.current.map((item) => item.milestoneId)).toEqual(["m2", "m1"]);
    expect(result.milestones.achieved.map((item) => item.milestoneId)).toEqual(["m4", "m3"]);
    expect(result.capabilities.map((item) => item.capabilityKey)).toEqual(SPORT_CAPABILITIES.Tennis.map((item) => item.capabilityKey));
    expect(result.capabilities.find((item) => item.capabilityKey === "serve")).toMatchObject({ label: "Serve", rating: 3, updatedAt: 50 });
  });

  it("returns empty arrays and null ratings for an empty profile", async () => {
    const { db } = makeDb(base({ learningMilestones: [], capabilityRatings: [], studentLearningProfiles: [{ ...profile, learningGoal: undefined }] }));
    const result = await getStudentLearningProfileDashboardData({ db } as never, studentSport._id as never);
    expect(result.profileStatus).toBe("ready");
    expect(result.milestones).toEqual({ current: [], next: [], achieved: [] });
    expect(result.capabilities.every((item) => item.rating === null && item.updatedAt === null)).toBe(true);
  });

  it("reports a missing profile without creating one", async () => {
    const { db, getWrites } = makeDb(base({ studentLearningProfiles: [] }));
    const result = await getStudentLearningProfileDashboardData({ db } as never, studentSport._id as never);
    expect(result.profileStatus).toBe("missing");
    expect(result.learningProfile).toBeNull();
    expect(result.capabilities.every((item) => item.rating === null)).toBe(true);
    expect(getWrites()).toBe(0);
  });

  it("rejects missing references and duplicate profiles", async () => {
    await expect(getStudentLearningProfileDashboardData({ db: makeDb().db } as never, "missing" as never)).rejects.toThrow("StudentSport");
    await expect(getStudentLearningProfileDashboardData({ db: makeDb({ studentSports: [studentSport] }).db } as never, studentSport._id as never)).rejects.toThrow("missing Student");
    await expect(getStudentLearningProfileDashboardData({ db: makeDb({ ...base(), students: [student], sports: [] }).db } as never, studentSport._id as never)).rejects.toThrow("missing Sport");
    await expect(getStudentLearningProfileDashboardData({ db: makeDb(base({ studentLearningProfiles: [profile, { ...profile, _id: "profile_2" }] })).db } as never, studentSport._id as never)).rejects.toThrow("Multiple Learning Profiles");
  });

  it("rejects duplicate and invalid stored ratings", async () => {
    const duplicate = makeDb(base({ capabilityRatings: [
      { _id: "r1", learningProfileId: profile._id, capabilityKey: "serve", rating: 2, updatedAt: 1 },
      { _id: "r2", learningProfileId: profile._id, capabilityKey: "serve", rating: 3, updatedAt: 2 },
    ] }));
    await expect(getStudentLearningProfileDashboardData({ db: duplicate.db } as never, studentSport._id as never)).rejects.toThrow("Multiple capability");
    const invalid = makeDb(base({ capabilityRatings: [{ _id: "r1", learningProfileId: profile._id, capabilityKey: "balance", rating: 2, updatedAt: 1 }] }));
    await expect(getStudentLearningProfileDashboardData({ db: invalid.db } as never, studentSport._id as never)).rejects.toThrow("not valid");
  });

  it("supports Ski capability configuration and deterministic achieved-date ties", async () => {
    const ski = { _id: "sport_ski", name: "Ski", status: "active" };
    const skiSport = { ...studentSport, _id: "studentSport_ski", sportId: ski._id };
    const skiProfile = { ...profile, _id: "profile_ski", studentSportId: skiSport._id };
    const { db } = makeDb({ studentSports: [skiSport], students: [student], sports: [ski], studentLearningProfiles: [skiProfile], learningMilestones: [
      { _id: "a", learningProfileId: skiProfile._id, milestoneText: "A", status: "achieved", achievedDate: "2026-01-01", createdAt: 1, updatedAt: 1 },
      { _id: "b", learningProfileId: skiProfile._id, milestoneText: "B", status: "achieved", achievedDate: "2026-01-01", createdAt: 1, updatedAt: 1 },
    ] });
    const result = await getStudentLearningProfileDashboardData({ db } as never, skiSport._id as never);
    expect(result.capabilities.map((item) => item.capabilityKey)).toEqual(SPORT_CAPABILITIES.Ski.map((item) => item.capabilityKey));
    expect(result.milestones.achieved.map((item) => item.milestoneId)).toEqual(["b", "a"]);
  });
});
