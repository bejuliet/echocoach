import { describe, expect, it } from "vitest";
import {
  assertNotCutOverToStage2,
  calculateStage1SequenceBaseline,
} from "./reviews";
import { cutoverTennisStudentData } from "./tennisCutover";

type TableName = "students" | "sports" | "studentSports" | "reviews";
type Row = Record<string, unknown> & { _id: string };
type QueryBuilder = {
  eq: (name: string, value: unknown) => QueryBuilder;
  gt: (field: string, value: number) => QueryBuilder;
};

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    students: seed.students ?? [],
    sports: seed.sports ?? [],
    studentSports: seed.studentSports ?? [],
    reviews: seed.reviews ?? [],
  };
  let nextId = 1;
  const db = {
    async get(id: string) {
      return Object.values(rows).flat().find((row) => row._id === id);
    },
    query(table: TableName) {
      const filters: Record<string, unknown> = {};
      let greaterThan: { field: string; value: number } | undefined;
      const chain = {
        withIndex(_name: string, callback: (q: QueryBuilder) => void) {
          callback({
            eq(name: string, value: unknown) {
              filters[name] = value;
              return this;
            },
            gt(field: string, value: number) {
              greaterThan = { field, value };
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
            Object.entries(filters).every(([key, value]) => row[key] === value) &&
            (!greaterThan || Number(row[greaterThan.field]) > greaterThan.value),
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
  };
  return { db, rows };
}

const tennis = { _id: "sport_tennis", name: "Tennis", status: "active" };

function review(id: string, studentId: string, createdAt: number, classNumber?: number) {
  return {
    _id: id,
    studentId,
    studentName: "Harper",
    whatWeDid: "drills",
    progress: "progress",
    nextSteps: "practice",
    message: "message",
    createdAt,
    ...(classNumber === undefined ? {} : { classNumber }),
  };
}

describe("progressive Tennis cutover", () => {
  it("calculates baseline from baseline count plus qualifying reviews only", async () => {
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const boundary = Date.parse("2026-08-12T23:59:59.999Z");
    const { db } = makeDb({
      students: [student],
      reviews: [
        review("r_before", student.studentId, boundary),
        review("r_1", student.studentId, boundary + 1, 99),
        review("r_2", student.studentId, boundary + 2, 1),
        review("r_3", student.studentId, boundary + 3, 2),
      ],
    });

    await expect(
      calculateStage1SequenceBaseline({ db } as never, student.studentId),
    ).resolves.toBe(13);
  });

  it("creates the cutover StudentSport with the frozen baseline", async () => {
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const boundary = Date.parse("2026-08-12T23:59:59.999Z");
    const { db, rows } = makeDb({
      students: [student],
      sports: [tennis],
      reviews: [
        review("r_1", student.studentId, boundary + 1),
        review("r_2", student.studentId, boundary + 2),
        review("r_3", student.studentId, boundary + 3),
      ],
    });

    const result = await cutoverTennisStudentData({ db } as never, student._id as never);

    expect(result.created).toBe(true);
    expect(result.sequenceBaseline).toBe(13);
    expect(result.stage2StartedAt).toEqual(expect.any(Number));
    expect(rows.studentSports).toHaveLength(1);
  });

  it("is idempotent and preserves the first cutover boundary", async () => {
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const existing = {
      _id: "studentSport_1",
      studentId: student._id,
      sportId: tennis._id,
      sequenceBaseline: 13,
      stage2StartedAt: 123,
    };
    const { db, rows } = makeDb({
      students: [student],
      sports: [tennis],
      studentSports: [existing],
      reviews: [review("r_new", student.studentId, Date.now())],
    });

    const result = await cutoverTennisStudentData({ db } as never, student._id as never);

    expect(result).toEqual({
      studentSportId: existing._id,
      created: false,
      sequenceBaseline: 13,
      stage2StartedAt: 123,
    });
    expect(rows.studentSports).toHaveLength(1);
  });

  it("rejects missing baseline fields and inactive or missing Tennis", async () => {
    const incomplete = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
    };
    const { db } = makeDb({ students: [incomplete], sports: [tennis] });
    await expect(
      cutoverTennisStudentData({ db } as never, incomplete._id as never),
    ).rejects.toThrow("not configured");

    const complete = {
      ...incomplete,
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const inactiveDb = makeDb({
      students: [complete],
      sports: [{ ...tennis, status: "inactive" }],
    });
    await expect(
      cutoverTennisStudentData({ db: inactiveDb.db } as never, complete._id as never),
    ).rejects.toThrow("inactive");
  });

  it("rejects an invalid existing StudentSport boundary", async () => {
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const { db } = makeDb({
      students: [student],
      sports: [tennis],
      studentSports: [{
        _id: "studentSport_1",
        studentId: student._id,
        sportId: tennis._id,
        sequenceBaseline: 0,
      }],
    });
    await expect(
      cutoverTennisStudentData({ db } as never, student._id as never),
    ).rejects.toThrow("without a valid Tennis cutover boundary");
  });

  it("blocks Stage 1 review writes for explicit and name-resolved cutover checks", async () => {
    const studentSport = {
      _id: "studentSport_1",
      studentId: "student_1",
      sportId: tennis._id,
      sequenceBaseline: 13,
      stage2StartedAt: 123,
    };
    const { db } = makeDb({
      sports: [tennis],
      studentSports: [studentSport],
    });

    await expect(
      assertNotCutOverToStage2({ db } as never, "student_1" as never),
    ).rejects.toThrow("moved to Stage 2");
    await expect(
      assertNotCutOverToStage2({ db } as never, "student_1" as never),
    ).rejects.toThrow("moved to Stage 2");
  });

  it("does not use classNumber or legacyStage1Reviews as baseline authority", async () => {
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
      baselineClassesTaken: 10,
      baselineThroughDate: "2026-08-12",
    };
    const { db } = makeDb({
      students: [student],
      reviews: [review("r_1", student.studentId, Date.parse("2026-08-13T00:00:00Z"), 999)],
    });

    await expect(
      calculateStage1SequenceBaseline({ db } as never, student.studentId),
    ).resolves.toBe(11);
  });
});
