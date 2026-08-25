import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

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

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export const createWithClass = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    startDate: v.string(),
    baselineClassesTaken: v.number(),
    notes: v.optional(v.string()),
    className: v.string(),
    students: v.string(),
    classType: v.union(v.literal("1:1"), v.literal("1:2"), v.literal("1:3"), v.literal("1:4")),
    classStatus: v.union(v.literal("Active"), v.literal("Inactive")),
    cycle: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const className = args.className.trim();
    const students = args.students.trim();
    if (!name || !className || !students || !args.startDate) {
      throw new ConvexError("Student name, start date, class name, and students are required.");
    }
    if (!Number.isInteger(args.baselineClassesTaken) || args.baselineClassesTaken < 0) {
      throw new ConvexError("Previous classes taken must be a whole number of 0 or more.");
    }
    const existing = await ctx.db.query("students").collect();
    if (existing.some((student) => normalizeName(student.name) === normalizeName(name))) {
      throw new ConvexError(`A student named ${name} already exists.`);
    }

    const suffix = crypto.randomUUID();
    const studentId = `stu_${suffix}`;
    const classId = `class_${suffix}`;
    const classes = await ctx.db.query("classes").collect();
    if (existing.some((student) => student.studentId === studentId) || classes.some((item) => item.classId === classId)) {
      throw new ConvexError("Could not generate a unique student ID. Please try again.");
    }

    await ctx.db.insert("students", {
      studentId,
      name,
      status: args.status,
      startDate: args.startDate,
      baselineClassesTaken: args.baselineClassesTaken,
      baselineThroughDate: args.startDate,
      ...(args.notes ? { notes: args.notes.trim() } : {}),
    });
    await ctx.db.insert("classes", {
      classId,
      displayName: className,
      memberStudentIds: [],
      students,
      classType: args.classType,
      status: args.classStatus,
      cycle: args.cycle.trim() || "Weekly",
    });
    return { studentId, classId };
  },
});
