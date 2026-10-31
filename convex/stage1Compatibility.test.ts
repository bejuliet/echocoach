import { describe, expect, it } from "vitest";
import { calculateStage1SequenceBaseline } from "./reviews";

type Row = Record<string, unknown> & { _id: string };
type QueryBuilder = {
  eq: (field: string, value: unknown) => QueryBuilder;
  gt: (field: string, value: unknown) => QueryBuilder;
};

function makeDb(rows: { students?: Row[]; reviews?: Row[] }) {
  const tables: Record<string, Row[]> = {
    students: rows.students ?? [],
    reviews: rows.reviews ?? [],
  };

  return {
    db: {
      query(table: string) {
        let result = [...(tables[table] ?? [])];
        const builder = {
          withIndex(_name: string, apply?: (q: QueryBuilder) => unknown) {
            if (apply) {
              const predicates: Array<(row: Row) => boolean> = [];
              const q = {
                eq(field: string, value: unknown) {
                  predicates.push((row) => row[field] === value);
                  return q;
                },
                gt(field: string, value: unknown) {
                  predicates.push((row) => Number(row[field]) > Number(value));
                  return q;
                },
              };
              apply(q);
              result = result.filter((row) => predicates.every((test) => test(row)));
            }
            return builder;
          },
          order(direction: "asc" | "desc") {
            result.sort((left, right) => Number(left.createdAt) - Number(right.createdAt));
            if (direction === "desc") result.reverse();
            return builder;
          },
          collect: async () => result,
          unique: async () => {
            if (result.length > 1) throw new Error("Expected a unique result");
            return result[0];
          },
        };
        return builder;
      },
    },
  };
}

const student = {
  _id: "student_doc_1",
  studentId: "stu_Max",
  name: "Max",
  status: "Active",
  baselineClassesTaken: 7,
  baselineThroughDate: "2026-08-12",
};

describe("Stage 1 compatibility: historical class numbering", () => {
  it("preserves the baseline when there are no qualifying reviews", async () => {
    const { db } = makeDb({ students: [student] });
    await expect(calculateStage1SequenceBaseline({ db } as never, "stu_Max")).resolves.toBe(7);
  });

  it("excludes reviews before and exactly at the inclusive cutoff boundary", async () => {
    const { db } = makeDb({
      students: [student],
      reviews: [
        { _id: "before", studentId: "stu_Max", createdAt: Date.parse("2026-08-12T23:59:59.998Z") },
        { _id: "at", studentId: "stu_Max", createdAt: Date.parse("2026-08-12T23:59:59.999Z") },
      ],
    });
    await expect(calculateStage1SequenceBaseline({ db } as never, "stu_Max")).resolves.toBe(7);
  });

  it("counts reviews strictly after the cutoff for the requested Student only", async () => {
    const { db } = makeDb({
      students: [student],
      reviews: [
        { _id: "qualifying", studentId: "stu_Max", createdAt: Date.parse("2026-08-13T00:00:00.000Z") },
        { _id: "other-student", studentId: "stu_Other", createdAt: Date.parse("2026-08-13T00:00:00.000Z") },
        { _id: "unresolved", createdAt: Date.parse("2026-08-13T00:00:00.000Z") },
      ],
    });
    await expect(calculateStage1SequenceBaseline({ db } as never, "stu_Max")).resolves.toBe(8);
  });

  it("does not use stored classNumber or legacy Class rows as the count source", async () => {
    const { db } = makeDb({
      students: [student],
      reviews: [
        {
          _id: "stored-number",
          studentId: "stu_Max",
          classNumber: 99,
          createdAt: Date.parse("2026-08-13T00:00:00.000Z"),
        },
      ],
    });
    await expect(calculateStage1SequenceBaseline({ db } as never, "stu_Max")).resolves.toBe(8);
  });

  it("reflects review deletion in the legacy recalculation while preserving the baseline", async () => {
    const reviews = [
      { _id: "one", studentId: "stu_Max", createdAt: Date.parse("2026-08-13T00:00:00.000Z") },
      { _id: "two", studentId: "stu_Max", createdAt: Date.parse("2026-08-14T00:00:00.000Z") },
    ];
    const first = makeDb({ students: [student], reviews });
    await expect(calculateStage1SequenceBaseline({ db: first.db } as never, "stu_Max")).resolves.toBe(9);

    const afterDeletion = makeDb({ students: [student], reviews: [reviews[0]] });
    await expect(calculateStage1SequenceBaseline({ db: afterDeletion.db } as never, "stu_Max")).resolves.toBe(8);
  });
});

type Stage1Handler = {
  _handler: (ctx: { db: unknown }, args?: unknown) => Promise<unknown>;
};
type Stage1Module = Record<string, Stage1Handler>;

async function loadStage1Module(file: "students" | "reviews"): Promise<Stage1Module> {
  if (file === "students") {
    return (await import("/Users/julietwei/Projects/EchoCoach/convex/students")) as unknown as Stage1Module;
  }
  return (await import("/Users/julietwei/Projects/EchoCoach/convex/reviews")) as unknown as Stage1Module;
}

function makeStage1Db(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {
    students: seed.students ?? [],
    classes: seed.classes ?? [],
    reviews: seed.reviews ?? [],
  };
  const db = {
    query(table: string) {
      let result = [...(tables[table] ?? [])];
      const builder = {
        withIndex(_name: string, apply?: (q: QueryBuilder) => unknown) {
          if (apply) {
            const predicates: Array<(row: Row) => boolean> = [];
            const q = {
              eq(field: string, value: unknown) {
                predicates.push((row) => row[field] === value);
                return q;
              },
              gt(field: string, value: unknown) {
                predicates.push((row) => Number(row[field]) > Number(value));
                return q;
              },
            };
            apply(q);
            result = result.filter((row) => predicates.every((test) => test(row)));
          }
          return builder;
        },
        order(direction: "asc" | "desc") {
          result.sort((left, right) => Number(left.createdAt) - Number(right.createdAt));
          if (direction === "desc") result.reverse();
          return builder;
        },
        collect: async () => result,
        unique: async () => (result.length > 1 ? Promise.reject(new Error("Expected unique")) : result[0]),
      };
      return builder;
    },
    insert: async (table: string, value: Row) => {
      const row = { ...value, _id: `${table}_created_${tables[table].length + 1}` };
      tables[table].push(row);
      return row._id;
    },
  };
  return { db, tables };
}

describe("Stage 1 compatibility: legacy API contracts", () => {
  it("reviews.create validates active Students and preserves review fields", async () => {
    const { create } = await loadStage1Module("reviews");
    const { db, tables } = makeStage1Db({
      students: [{ ...student, _id: "student_doc_1" }],
    });
    const id = await create._handler({ db }, {
      studentId: "stu_Max",
      studentName: "ignored display name",
      whatWeDid: "Forehand rally",
      progress: "Improved consistency",
      nextSteps: "Practice footwork",
      message: "Great work today.",
    });
    expect(id).toMatch(/^reviews_created_/);
    expect(tables.reviews[0]).toMatchObject({
      studentId: "stu_Max",
      studentName: "Max",
      whatWeDid: "Forehand rally",
      progress: "Improved consistency",
      nextSteps: "Practice footwork",
      message: "Great work today.",
      classNumber: 8,
    });
    await expect(create._handler({ db }, {
      studentId: "stu_missing",
      studentName: "Missing",
      whatWeDid: "x",
      progress: "x",
      nextSteps: "x",
      message: "x",
    })).rejects.toThrow("active student");
  });

  it("reviews.list returns legacy records newest first", async () => {
    const { list } = await loadStage1Module("reviews");
    const older = { _id: "r1", studentName: "Max", message: "old", createdAt: 1 };
    const newer = { _id: "r2", studentName: "Max", message: "new", createdAt: 2 };
    const { db } = makeStage1Db({ reviews: [older, newer] });
    await expect(list._handler({ db })).resolves.toEqual([newer, older]);
  });

  it("students.listActive returns only active Student IDs and names", async () => {
    const { listActive } = await loadStage1Module("students");
    const { db } = makeStage1Db({ students: [
      { _id: "a", studentId: "stu_Active", name: "Zoe", status: "Active" },
      { _id: "b", studentId: "stu_Inactive", name: "Amy", status: "Inactive" },
    ] });
    await expect(listActive._handler({ db })).resolves.toEqual([
      { studentId: "stu_Active", name: "Zoe" },
    ]);
  });

  it("students.createWithClass preserves baseline and legacy Class fields", async () => {
    const { createWithClass } = await loadStage1Module("students");
    const { db, tables } = makeStage1Db();
    const result = await createWithClass._handler({ db }, {
      name: "New Student",
      status: "Active",
      startDate: "2026-08-15",
      baselineClassesTaken: 4,
      notes: "synthetic",
      className: "New Student Class",
      students: "New Student, Partner",
      classType: "1:2",
      classStatus: "Active",
      cycle: "Weekly",
    });
    expect((result as { studentId: string; classId: string }).studentId).toMatch(/^stu_/);
    expect((result as { studentId: string; classId: string }).classId).toMatch(/^class_/);
    expect(tables.students[0]).toMatchObject({
      name: "New Student",
      baselineClassesTaken: 4,
      baselineThroughDate: "2026-08-15",
    });
    expect(tables.classes[0]).toMatchObject({
      displayName: "New Student Class",
      memberStudentIds: [],
      students: "New Student, Partner",
      classType: "1:2",
      cycle: "Weekly",
    });
    await expect(createWithClass._handler({ db }, {
      name: " new student ", status: "Active", startDate: "2026-08-15",
      baselineClassesTaken: 0, className: "Another", students: "New Student",
      classType: "1:1", classStatus: "Active", cycle: "Weekly",
    })).rejects.toThrow("already exists");
  });
});
