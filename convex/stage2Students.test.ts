import { describe, expect, it } from "vitest";
import {
  createStage2StudentData,
  enrollStudentInSportData,
  updateStudentContactData,
} from "./stage2Students";

type TableName = "students" | "sports" | "studentSports" | "studentLearningProfiles";
type Row = Record<string, unknown> & { _id: string };
type QueryBuilder = {
  eq: (name: string, value: unknown) => QueryBuilder;
};

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    students: seed.students ?? [],
    sports: seed.sports ?? [],
    studentSports: seed.studentSports ?? [],
    studentLearningProfiles: seed.studentLearningProfiles ?? [],
  };
  let nextId = 1;
  const db = {
    async get(id: string) {
      return Object.values(rows).flat().find((row) => row._id === id);
    },
    query(table: TableName) {
      const filters: Record<string, unknown> = {};
      const chain = {
        withIndex(_name: string, callback: (q: QueryBuilder) => void) {
          callback({
            eq(name: string, value: unknown) {
              filters[name] = value;
              return this;
            },
          });
          return chain;
        },
        async unique() {
          const matches = rows[table].filter((row) =>
            Object.entries(filters).every(([key, value]) => row[key] === value),
          );
          if (matches.length > 1) throw new Error("Expected unique result");
          return matches[0];
        },
        async collect() {
          return rows[table].filter((row) =>
            Object.entries(filters).every(([key, value]) => row[key] === value),
          );
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
      const row = Object.values(rows).flat().find((item) => item._id === id);
      if (!row) throw new Error("missing row");
      for (const [key, nextValue] of Object.entries(value)) {
        if (nextValue === undefined) delete row[key];
        else row[key] = nextValue;
      }
    },
  };
  return { db, rows };
}

const ski = { _id: "sport_ski", name: "Ski", status: "active" };
const tennis = { _id: "sport_tennis", name: "Tennis", status: "active" };

describe("Stage 2-native Student and StudentSport", () => {
  it("creates a new Ski Student without fabricated Stage 1 fields", async () => {
    const { db, rows } = makeDb({ sports: [ski] });

    const result = await createStage2StudentData({ db } as never, {
      name: "Maya",
      sportId: ski._id as never,
    });

    expect(result.studentSport.sequenceBaseline).toBe(0);
    expect(result.studentSport.stage2StartedAt).toEqual(expect.any(Number));
    expect(rows.students[0]).toEqual({
      _id: expect.any(String),
      name: "Maya",
      status: "active",
    });
    expect(rows.studentSports).toHaveLength(1);
  });

  it("enrolls an explicitly selected existing Student in Ski", async () => {
    const student = { _id: "student_1", name: "Harper", status: "Active" };
    const { db, rows } = makeDb({ students: [student], sports: [ski] });

    const result = await enrollStudentInSportData({ db } as never, {
      studentId: student._id as never,
      sportId: ski._id as never,
    });

    expect(result.created).toBe(true);
    expect(rows.students).toHaveLength(1);
    expect(rows.studentSports).toHaveLength(1);
  });

  it("returns the existing StudentSport on retry", async () => {
    const student = { _id: "student_1", name: "Harper", status: "active" };
    const existing = {
      _id: "studentSport_1",
      studentId: student._id,
      sportId: ski._id,
      sequenceBaseline: 0,
      stage2StartedAt: 123,
    };
    const { db, rows } = makeDb({
      students: [student],
      sports: [ski],
      studentSports: [existing],
    });

    const result = await enrollStudentInSportData({ db } as never, {
      studentId: student._id as never,
      sportId: ski._id as never,
    });

    expect(result).toEqual({
      id: existing._id,
      created: false,
      sequenceBaseline: 0,
      stage2StartedAt: 123,
      learningProfileId: "studentLearningProfiles_1",
    });
    expect(rows.studentSports).toHaveLength(1);
  });

  it("rejects an inactive Sport", async () => {
    const inactiveSki = { ...ski, status: "inactive" };
    const { db } = makeDb({ sports: [inactiveSki] });

    await expect(
      createStage2StudentData({ db } as never, {
        name: "Maya",
        sportId: ski._id as never,
      }),
    ).rejects.toThrow("Sport is inactive.");
  });

  it("rejects a nonexistent Student", async () => {
    const { db } = makeDb({ sports: [ski] });

    await expect(
      enrollStudentInSportData({ db } as never, {
        studentId: "missing" as never,
        sportId: ski._id as never,
      }),
    ).rejects.toThrow("Student not found.");
  });

  it("rejects a nonexistent Sport", async () => {
    const { db } = makeDb();

    await expect(
      createStage2StudentData({ db } as never, {
        name: "Maya",
        sportId: "missing" as never,
      }),
    ).rejects.toThrow("Sport not found.");
  });

  it("does not merge two different Students with the same name", async () => {
    const { db, rows } = makeDb({ sports: [ski] });

    await createStage2StudentData({ db } as never, {
      name: "Alex",
      sportId: ski._id as never,
    });
    await createStage2StudentData({ db } as never, {
      name: "Alex",
      sportId: ski._id as never,
    });

    expect(rows.students).toHaveLength(2);
    expect(rows.students[0]._id).not.toBe(rows.students[1]._id);
  });

  it("rejects native baseline-zero enrollment for a Stage 1 Tennis Student", async () => {
    const student = {
      _id: "student_1",
      name: "Harper",
      status: "Active",
      studentId: "stu_Harper",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const { db } = makeDb({ students: [student], sports: [tennis] });

    await expect(
      enrollStudentInSportData({ db } as never, {
        studentId: student._id as never,
        sportId: tennis._id as never,
      }),
    ).rejects.toThrow("requires the Stage 1 cutover flow");
  });

  it("stores optional contact fields and supports clearing them", async () => {
    const { db, rows } = makeDb({ sports: [ski] });
    const result = await createStage2StudentData({ db } as never, {
      name: "Maya",
      sportId: ski._id as never,
      mobilePhone: "  +1 555 0100 ",
      email: " maya@example.com ",
      contactName: "  Alex Maya ",
    });

    expect(rows.students[0]).toMatchObject({
      mobilePhone: "+1 555 0100",
      email: "maya@example.com",
      contactName: "Alex Maya",
    });
    await updateStudentContactData({ db } as never, {
      studentId: result.studentId as never,
      email: null,
      contactName: "  ",
    });
    expect(rows.students[0]).not.toHaveProperty("email");
    expect(rows.students[0]).not.toHaveProperty("contactName");
    expect(rows.students[0]).toHaveProperty("mobilePhone", "+1 555 0100");
  });

  it("rejects malformed contact email values", async () => {
    const { db } = makeDb({ sports: [ski] });
    await expect(
      createStage2StudentData({ db } as never, {
        name: "Maya",
        sportId: ski._id as never,
        email: "not-an-email",
      }),
    ).rejects.toThrow("Email address is invalid.");
  });
});
