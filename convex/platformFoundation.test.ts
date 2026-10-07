import { describe, expect, it } from "vitest";
import { ensureFoundation } from "./platformFoundation";

type TableName = "sports" | "coaches" | "coachSports";
type Row = Record<string, unknown> & { _id: string };

function makeDb() {
  const rows: Record<TableName, Row[]> = {
    sports: [],
    coaches: [],
    coachSports: [],
  };
  let nextId = 1;

  const db = {
    query(table: TableName) {
      let field = "";
      let value: unknown;
      const chain = {
        withIndex(_name: string, callback: (q: { eq: (name: string, next: unknown) => typeof q }) => void) {
          callback({
            eq(name: string, next: unknown) {
              field = name;
              value = next;
              return this;
            },
          });
          return chain;
        },
        async unique() {
          const matches = rows[table].filter((row) => row[field] === value);
          if (matches.length > 1) throw new Error("Expected unique result");
          return matches[0];
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

describe("platform foundation", () => {
  it("creates the approved reference records on first run", async () => {
    const { db, rows } = makeDb();

    const result = await ensureFoundation({ db } as never);

    expect(result.sports.tennis.created).toBe(true);
    expect(result.sports.ski.created).toBe(true);
    expect(result.coach.created).toBe(true);
    expect(result.coachSports.tennis.created).toBe(true);
    expect(result.coachSports.ski.created).toBe(true);
    expect(rows.sports).toHaveLength(2);
    expect(rows.coaches).toHaveLength(1);
    expect(rows.coachSports).toHaveLength(2);
  });

  it("creates no duplicates when rerun", async () => {
    const { db, rows } = makeDb();

    await ensureFoundation({ db } as never);
    const result = await ensureFoundation({ db } as never);

    expect(result.sports.tennis.created).toBe(false);
    expect(result.sports.ski.created).toBe(false);
    expect(result.coach.created).toBe(false);
    expect(result.coachSports.tennis.created).toBe(false);
    expect(result.coachSports.ski.created).toBe(false);
    expect(rows.sports).toHaveLength(2);
    expect(rows.coaches).toHaveLength(1);
    expect(rows.coachSports).toHaveLength(2);
  });
});
