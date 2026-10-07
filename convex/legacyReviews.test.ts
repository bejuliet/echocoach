import { describe, expect, it } from "vitest";
import { copyLegacyReviewData } from "./legacyReviews";

type TableName = "reviews" | "students" | "legacyStage1Reviews";
type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    reviews: seed.reviews ?? [],
    students: seed.students ?? [],
    legacyStage1Reviews: seed.legacyStage1Reviews ?? [],
  };
  let nextId = 1;
  const db = {
    async get(id: string) {
      return Object.values(rows).flat().find((row) => row._id === id);
    },
    query(table: TableName) {
      const filters: Record<string, unknown> = {};
      const chain = {
        withIndex(_name: string, callback: (q: {
          eq: (name: string, value: unknown) => unknown;
        }) => void) {
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
  };
  return { db, rows };
}

function sourceReview(overrides: Record<string, unknown> = {}) {
  return {
    _id: "review_1",
    studentId: "stu_harper",
    studentName: "Harper",
    classNumber: 12,
    whatWeDid: "drills",
    progress: "progress",
    nextSteps: "practice",
    message: "message",
    createdAt: 1234,
    ...overrides,
  };
}

describe("legacy Stage 1 review preservation", () => {
  it("copies historical fields and maps a valid Stage 1 studentId", async () => {
    const source = sourceReview();
    const student = {
      _id: "student_1",
      studentId: "stu_harper",
      name: "Harper",
      status: "Active",
    };
    const { db, rows } = makeDb({ reviews: [source], students: [student] });

    const result = await copyLegacyReviewData({ db } as never, source._id as never);

    expect(result.created).toBe(true);
    expect(rows.legacyStage1Reviews[0]).toMatchObject({
      legacyReviewId: "review_1",
      studentId: student._id,
      studentName: "Harper",
      classNumber: 12,
      whatWeDid: "drills",
      progress: "progress",
      nextSteps: "practice",
      message: "message",
      createdAt: 1234,
      sourceTable: "reviews",
      migratedAt: expect.any(Number),
    });
  });

  it("maps a missing studentId only for one unique normalized-name match", async () => {
    const source = sourceReview({ studentId: undefined, studentName: " harper " });
    const student = {
      _id: "student_1",
      name: "Harper",
      status: "active",
    };
    const { db, rows } = makeDb({ reviews: [source], students: [student] });

    await copyLegacyReviewData({ db } as never, source._id as never);

    expect(rows.legacyStage1Reviews[0].studentId).toBe(student._id);
  });

  it("preserves ambiguous and unmatched names without inventing a Student", async () => {
    const ambiguous = sourceReview({ studentId: undefined, studentName: "Alex" });
    const unmatched = sourceReview({ _id: "review_2", studentId: undefined, studentName: "Missing" });
    const students = [
      { _id: "student_1", name: "Alex", status: "active" },
      { _id: "student_2", name: " alex ", status: "active" },
    ];
    const { db, rows } = makeDb({ reviews: [ambiguous, unmatched], students });

    await copyLegacyReviewData({ db } as never, ambiguous._id as never);
    await copyLegacyReviewData({ db } as never, unmatched._id as never);

    expect(rows.students).toHaveLength(2);
    expect(rows.legacyStage1Reviews).toHaveLength(2);
    expect(rows.legacyStage1Reviews[0].studentId).toBeUndefined();
    expect(rows.legacyStage1Reviews[1].studentId).toBeUndefined();
  });

  it("preserves a review without classNumber and never creates structured records", async () => {
    const source = sourceReview({ classNumber: undefined });
    const { db, rows } = makeDb({ reviews: [source] });

    await copyLegacyReviewData({ db } as never, source._id as never);

    expect(rows.legacyStage1Reviews[0].classNumber).toBeUndefined();
    expect(rows.students).toHaveLength(0);
  });

  it("is idempotent by source review identity", async () => {
    const source = sourceReview();
    const { db, rows } = makeDb({ reviews: [source] });

    const first = await copyLegacyReviewData({ db } as never, source._id as never);
    const second = await copyLegacyReviewData({ db } as never, source._id as never);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(rows.legacyStage1Reviews).toHaveLength(1);
  });

  it("preserves createdAt as provenance and does not create session dates", async () => {
    const source = sourceReview({ createdAt: 987654 });
    const { db, rows } = makeDb({ reviews: [source] });

    await copyLegacyReviewData({ db } as never, source._id as never);

    expect(rows.legacyStage1Reviews[0].createdAt).toBe(987654);
    expect(rows.legacyStage1Reviews[0]).not.toHaveProperty("sessionDate");
  });
});
