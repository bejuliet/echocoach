import { describe, expect, it } from "vitest";
import { ensureLearningProfile } from "./learningProfiles";

type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: { studentSports?: Row[]; profiles?: Row[] } = {}) {
  const rows = {
    studentSports: seed.studentSports ?? [],
    studentLearningProfiles: seed.profiles ?? [],
  };
  let nextId = 1;
  const db = {
    async get(id: string) {
      return Object.values(rows).flat().find((row) => row._id === id);
    },
    query(table: "studentLearningProfiles") {
      let studentSportId = "";
      const chain = {
        withIndex(_name: string, callback: (q: { eq: (name: string, value: unknown) => unknown }) => void) {
          callback({ eq(_name: string, value: unknown) { studentSportId = String(value); return this; } });
          return chain;
        },
        async collect() {
          return rows[table].filter((row) => row.studentSportId === studentSportId);
        },
      };
      return chain;
    },
    async insert(_table: "studentLearningProfiles", value: Record<string, unknown>) {
      const row = { ...value, _id: `profile_${nextId++}` };
      rows.studentLearningProfiles.push(row);
      return row._id;
    },
  };
  return { db, rows };
}

describe("ensureLearningProfile", () => {
  it("creates an empty profile for an existing StudentSport", async () => {
    const { db, rows } = makeDb({ studentSports: [{ _id: "ss_1" }] });

    const id = await ensureLearningProfile({ db } as never, "ss_1" as never);

    expect(id).toBe("profile_1");
    expect(rows.studentLearningProfiles[0]).toMatchObject({
      studentSportId: "ss_1",
      updatedAt: expect.any(Number),
    });
    expect(rows.studentLearningProfiles[0]).not.toHaveProperty("learningGoal");
  });

  it("reuses an existing profile without changing it", async () => {
    const profile = { _id: "profile_1", studentSportId: "ss_1", updatedAt: 123 };
    const { db, rows } = makeDb({ studentSports: [{ _id: "ss_1" }], profiles: [profile] });

    const id = await ensureLearningProfile({ db } as never, "ss_1" as never);

    expect(id).toBe(profile._id);
    expect(rows.studentLearningProfiles).toEqual([profile]);
  });

  it("rejects duplicate profiles and missing StudentSports", async () => {
    const duplicate = makeDb({
      studentSports: [{ _id: "ss_1" }],
      profiles: [
        { _id: "profile_1", studentSportId: "ss_1" },
        { _id: "profile_2", studentSportId: "ss_1" },
      ],
    });
    await expect(ensureLearningProfile({ db: duplicate.db } as never, "ss_1" as never))
      .rejects.toThrow("Multiple Learning Profiles");

    const missing = makeDb();
    await expect(ensureLearningProfile({ db: missing.db } as never, "missing" as never))
      .rejects.toThrow("StudentSport not found");
  });
});
