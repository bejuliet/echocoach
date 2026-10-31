import { describe, expect, it } from "vitest";
import {
  requireCoachSportAccess,
  requireStudentAccess,
  resolveCoachForIdentity,
} from "./authorization";

type Row = Record<string, unknown> & { _id: string };

function makeDb(tables: Record<string, Row[]>) {
  return {
    async get(id: string) {
      return Object.values(tables).flat().find((row) => row._id === id);
    },
    query(table: string) {
      let filters: Record<string, unknown> = {};
      const builder = {
        withIndex(_name: string, apply: (q: { eq: (key: string, value: unknown) => unknown }) => unknown) {
          const q = { eq(key: string, value: unknown) { filters = { ...filters, [key]: value }; return q; } };
          apply(q);
          return builder;
        },
        async collect() {
          return (tables[table] ?? []).filter((row) =>
            Object.entries(filters).every(([key, value]) => row[key] === value),
          );
        },
        async unique() {
          const matches = await builder.collect();
          if (matches.length > 1) throw new Error("Expected unique result");
          return matches[0];
        },
      };
      return builder;
    },
  };
}

const coach = { _id: "coach_1", name: "Tom", status: "active", externalUserId: "user_1" };
const sport = { _id: "sport_1", name: "Tennis", status: "active" };
const student = { _id: "student_1", name: "Maya", status: "active" };

describe("provider-independent Coach authorization", () => {
  it("resolves an active Coach from a verified external identity", async () => {
    const db = makeDb({ coaches: [coach] });
    await expect(resolveCoachForIdentity({ db } as never, { subject: "user_1" })).resolves.toEqual(coach);
  });

  it.each([
    [null, "Authentication required."],
    [{ subject: "unknown" }, "Coach identity is not registered."],
  ])("denies invalid identity %j", async (identity, message) => {
    const db = makeDb({ coaches: [coach] });
    await expect(resolveCoachForIdentity({ db } as never, identity)).rejects.toThrow(message);
  });

  it("denies inactive and ambiguous Coach mappings", async () => {
    await expect(resolveCoachForIdentity({ db: makeDb({ coaches: [{ ...coach, status: "inactive" }] }) } as never, { subject: "user_1" })).rejects.toThrow("inactive");
    await expect(resolveCoachForIdentity({ db: makeDb({ coaches: [coach, { ...coach, _id: "coach_2" }] }) } as never, { subject: "user_1" })).rejects.toThrow("ambiguous");
  });

  it("allows only an associated active Sport", async () => {
    const db = makeDb({ sports: [sport], coachSports: [{ _id: "cs_1", coachId: coach._id, sportId: sport._id }] });
    await expect(requireCoachSportAccess({ db } as never, coach._id as never, sport._id as never)).resolves.toEqual(sport);
    await expect(requireCoachSportAccess({ db } as never, "coach_other" as never, sport._id as never)).rejects.toThrow("denied");
  });

  it("allows a shared Student only through the Coach's authorized Sport", async () => {
    const db = makeDb({
      students: [student], sports: [sport],
      studentSports: [{ _id: "ss_1", studentId: student._id, sportId: sport._id }],
      coachSports: [{ _id: "cs_1", coachId: coach._id, sportId: sport._id }],
    });
    await expect(requireStudentAccess({ db } as never, coach._id as never, student._id as never)).resolves.toEqual(student);
    await expect(requireStudentAccess({ db } as never, "coach_other" as never, student._id as never)).rejects.toThrow("denied");
  });
});
