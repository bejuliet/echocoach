import { query } from "./_generated/server";

// The Review Intake selector only needs active student identities and names.
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    return students
      .filter((student) => student.status === "Active")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ studentId, name }) => ({ studentId, name }));
  },
});
