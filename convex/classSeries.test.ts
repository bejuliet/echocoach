import { describe, expect, it } from "vitest";
import {
  changeClassSeriesMembershipData,
  createClassSeriesData,
} from "./classSeries";

type TableName = "coaches" | "sports" | "coachSports" | "students" | "studentSports" | "classSeries" | "classSeriesStudents" | "classSessions";
type Row = Record<string, unknown> & { _id: string };

function makeDb(seed: Partial<Record<TableName, Row[]>> = {}) {
  const rows: Record<TableName, Row[]> = {
    coaches: seed.coaches ?? [], sports: seed.sports ?? [], coachSports: seed.coachSports ?? [],
    students: seed.students ?? [], studentSports: seed.studentSports ?? [],
    classSeries: seed.classSeries ?? [], classSeriesStudents: seed.classSeriesStudents ?? [],
    classSessions: seed.classSessions ?? [],
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
        async unique() {
          const matches = rows[table].filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value));
          if (matches.length > 1) throw new Error("Expected unique result");
          return matches[0];
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
      for (const table of Object.keys(rows) as TableName[]) {
        rows[table] = rows[table].filter((row) => row._id !== id);
      }
    },
  };
  return { db, rows };
}

const coach = { _id: "coach_1", name: "Tom Tao", status: "active" };
const sport = { _id: "sport_1", name: "Tennis", status: "active" };
const students = [
  { _id: "student_1", name: "Harper", status: "Active" },
  { _id: "student_2", name: "Abby", status: "active" },
  { _id: "student_3", name: "Casey", status: "active" },
];
const base = {
  coaches: [coach], sports: [sport], coachSports: [{ _id: "cs_1", coachId: coach._id, sportId: sport._id }],
  students, studentSports: students.map((student) => ({
    _id: `ss_${student._id}`, studentId: student._id, sportId: sport._id,
    sequenceBaseline: 0, stage2StartedAt: 100,
  })),
};

describe("ClassSeries management", () => {
  it("creates valid 1:1 and group Series, accepting uppercase Active", async () => {
    const { db, rows } = makeDb(base);
    await createClassSeriesData({ db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[0]._id as never],
    });
    await createClassSeriesData({ db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[1]._id as never, students[2]._id as never],
    });
    expect(rows.classSeries).toHaveLength(2);
    expect(rows.classSeriesStudents).toHaveLength(3);
  });

  it("treats membership order as the same active Series identity", async () => {
    const { db } = makeDb(base);
    await createClassSeriesData({ db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[1]._id as never, students[2]._id as never],
    });
    await expect(createClassSeriesData({ db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[2]._id as never, students[1]._id as never],
    })).rejects.toThrow("already exists");
  });

  it("rejects missing CoachSport, StudentSport, and inactive records", async () => {
    const { db } = makeDb({ ...base, coachSports: [] });
    await expect(createClassSeriesData({ db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[0]._id as never],
    })).rejects.toThrow("not configured");

    const missingStudentSport = makeDb({ ...base, studentSports: [] });
    await expect(createClassSeriesData({ db: missingStudentSport.db } as never, {
      coachId: coach._id as never, sportId: sport._id as never, studentIds: [students[0]._id as never],
    })).rejects.toThrow("not enrolled");
  });

  it("corrects unused Series membership in place", async () => {
    const existing = { _id: "series_1", coachId: coach._id, sportId: sport._id, status: "active" };
    const { db, rows } = makeDb({ ...base, classSeries: [existing], classSeriesStudents: [{ _id: "m_1", classSeriesId: existing._id, studentId: students[0]._id }] });
    const result = await changeClassSeriesMembershipData({ db } as never, {
      classSeriesId: existing._id as never, studentIds: [students[1]._id as never],
    });
    expect(result).toMatchObject({ classSeriesId: existing._id, correctedInPlace: true });
    expect(rows.classSeries).toHaveLength(1);
    expect(rows.classSeriesStudents[0].studentId).toBe(students[1]._id);
  });

  it("creates a new active Series and preserves the used Series", async () => {
    const existing = { _id: "series_1", coachId: coach._id, sportId: sport._id, status: "active" };
    const { db, rows } = makeDb({
      ...base,
      classSeries: [existing],
      classSeriesStudents: [{ _id: "m_1", classSeriesId: existing._id, studentId: students[0]._id }],
      classSessions: [{ _id: "session_1", classSeriesId: existing._id, sessionSequenceNumber: 1 }],
    });
    const result = await changeClassSeriesMembershipData({ db } as never, {
      classSeriesId: existing._id as never, studentIds: [students[1]._id as never],
    });
    expect(result.created).toBe(true);
    expect(rows.classSeries).toHaveLength(2);
    expect(rows.classSeries[0].status).toBe("inactive");
    expect(rows.classSeriesStudents).toHaveLength(2);
  });
});
