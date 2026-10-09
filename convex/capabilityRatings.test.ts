import { describe, expect, it } from "vitest";
import {
  clearCapabilityRatingData,
  updateCapabilityRatingData,
} from "./capabilityRatings";

type TableName = "studentLearningProfiles" | "studentSports" | "sports" | "capabilityRatings" | "learningMilestones";
type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    studentLearningProfiles: seed.studentLearningProfiles ?? [],
    studentSports: seed.studentSports ?? [],
    sports: seed.sports ?? [],
    capabilityRatings: seed.capabilityRatings ?? [],
    learningMilestones: seed.learningMilestones ?? [],
  };
  let nextId = 1;
  const db = {
    async get(id: string) { return Object.values(rows).flat().find((row) => row._id === id); },
    query(table: TableName) {
      const filters: Record<string, unknown> = {};
      const chain = {
        withIndex(_name: string, callback: (q: { eq: (name: string, value: unknown) => unknown }) => void) {
          callback({ eq(name: string, value: unknown) { filters[name] = value; return this; } });
          return chain;
        },
        async collect() {
          return rows[table].filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value));
        },
      };
      return chain;
    },
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
    async delete(id: string) {
      for (const table of Object.keys(rows) as TableName[]) rows[table] = rows[table].filter((row) => row._id !== id);
    },
  };
  return { db, rows };
}

const tennis = { _id: "sport_tennis", name: "Tennis", status: "active" };
const ski = { _id: "sport_ski", name: "Ski", status: "active" };
const profile = { _id: "profile_1", studentSportId: "studentSport_1", updatedAt: 100, learningGoal: "Goal" };

function base(sport = tennis) {
  return {
    studentLearningProfiles: [profile],
    studentSports: [{ _id: "studentSport_1", studentId: "student_1", sportId: sport._id, sequenceBaseline: 7, stage2StartedAt: 123 }],
    sports: [sport],
  };
}

describe("Capability Ratings", () => {
  it("creates Tennis and Ski ratings", async () => {
    const tennisDb = makeDb(base());
    await expect(updateCapabilityRatingData({ db: tennisDb.db } as never, { learningProfileId: profile._id as never, capabilityKey: "forehand", rating: 3 })).resolves.toMatchObject({ rating: 3 });
    const skiProfile = { ...profile, _id: "profile_2", studentSportId: "studentSport_2" };
    const skiDb = makeDb({ studentLearningProfiles: [skiProfile], studentSports: [{ _id: "studentSport_2", sportId: ski._id }], sports: [ski] });
    await expect(updateCapabilityRatingData({ db: skiDb.db } as never, { learningProfileId: skiProfile._id as never, capabilityKey: "balance", rating: 4 })).resolves.toMatchObject({ rating: 4 });
  });

  it("updates an existing rating and identical updates are no-ops", async () => {
    const existing = { _id: "rating_1", learningProfileId: profile._id, capabilityKey: "serve", rating: 2, updatedAt: 100 };
    const { db, rows } = makeDb({ ...base(), capabilityRatings: [existing] });
    await updateCapabilityRatingData({ db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve", rating: 4 });
    expect(rows.capabilityRatings[0]).toMatchObject({ _id: "rating_1", rating: 4 });
    const updatedAt = rows.capabilityRatings[0].updatedAt;
    await updateCapabilityRatingData({ db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve", rating: 4 });
    expect(rows.capabilityRatings[0].updatedAt).toBe(updatedAt);
    expect(rows.capabilityRatings).toHaveLength(1);
  });

  it("rejects invalid, decimal, non-finite, cross-sport, and unknown ratings", async () => {
    const { db } = makeDb(base());
    const args = { learningProfileId: profile._id as never, capabilityKey: "forehand" };
    for (const rating of [0, 6, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(updateCapabilityRatingData({ db } as never, { ...args, rating })).rejects.toThrow();
    }
    await expect(updateCapabilityRatingData({ db } as never, { ...args, capabilityKey: "balance", rating: 3 })).rejects.toThrow();
    await expect(updateCapabilityRatingData({ db } as never, { ...args, capabilityKey: "unknown", rating: 3 })).rejects.toThrow();
  });

  it("rejects missing profile, StudentSport, Sport, and unsupported Sport", async () => {
    const missingProfile = makeDb({ sports: [tennis] });
    await expect(updateCapabilityRatingData({ db: missingProfile.db } as never, { learningProfileId: "missing" as never, capabilityKey: "serve", rating: 3 })).rejects.toThrow("Learning Profile");
    const missingSport = makeDb({ studentLearningProfiles: [profile] });
    await expect(updateCapabilityRatingData({ db: missingSport.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve", rating: 3 })).rejects.toThrow("StudentSport");
    const missingSportRow = makeDb({ ...base(), sports: [] });
    await expect(updateCapabilityRatingData({ db: missingSportRow.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve", rating: 3 })).rejects.toThrow("Sport");
    const unsupported = makeDb({ ...base({ _id: "sport_other", name: "Snowboard", status: "active" }) });
    await expect(updateCapabilityRatingData({ db: unsupported.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve", rating: 3 })).rejects.toThrow("supported");
  });

  it("detects duplicates and clears existing or missing ratings", async () => {
    const duplicate = makeDb({ ...base(), capabilityRatings: [
      { _id: "r1", learningProfileId: profile._id, capabilityKey: "serve", rating: 2 },
      { _id: "r2", learningProfileId: profile._id, capabilityKey: "serve", rating: 3 },
    ] });
    await expect(clearCapabilityRatingData({ db: duplicate.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve" })).rejects.toThrow("Multiple");
    const normal = makeDb({ ...base(), capabilityRatings: [{ _id: "r1", learningProfileId: profile._id, capabilityKey: "serve", rating: 2 }] });
    await expect(clearCapabilityRatingData({ db: normal.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve" })).resolves.toMatchObject({ cleared: true });
    await expect(clearCapabilityRatingData({ db: normal.db } as never, { learningProfileId: profile._id as never, capabilityKey: "serve" })).resolves.toMatchObject({ cleared: false });
    expect(normal.rows.studentLearningProfiles[0]).toEqual(profile);
  });
});
