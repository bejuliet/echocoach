import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAuthenticatedCoach } from "./authorization";

// The Review Intake selector only needs active student identities and names.
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const coachSports = await ctx.db.query("coachSports").withIndex("by_coach", (q) => q.eq("coachId", coach._id)).collect();
    const sportIds = new Set(coachSports.map((relationship) => relationship.sportId));
    const enrollments = (await Promise.all([...sportIds].map((sportId) =>
      ctx.db.query("studentSports").withIndex("by_sport", (q) => q.eq("sportId", sportId)).collect(),
    ))).flat();
    const authorizedStudentIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
    const students = await ctx.db.query("students").collect();
    return students
      .filter((student) => student.status === "Active" && authorizedStudentIds.has(student._id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((student) =>
        student.studentId ? [{ studentId: student.studentId, name: student.name }] : [],
      );
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
    mobilePhone: v.optional(v.string()),
    email: v.optional(v.string()),
    contactName: v.optional(v.string()),
    className: v.string(),
    students: v.string(),
    classType: v.union(v.literal("1:1"), v.literal("1:2"), v.literal("1:3"), v.literal("1:4")),
    classStatus: v.union(v.literal("Active"), v.literal("Inactive")),
    cycle: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedCoach(ctx);
    const name = args.name.trim();
    const className = args.className.trim();
    const students = args.students.trim();
    if (!name || !className || !students || !args.startDate) {
      throw new ConvexError("Student name, start date, class name, and students are required.");
    }
    if (!Number.isInteger(args.baselineClassesTaken) || args.baselineClassesTaken < 0) {
      throw new ConvexError("Previous classes taken must be a whole number of 0 or more.");
    }
    if (args.email?.trim() && !/^\S+@\S+\.\S+$/.test(args.email.trim())) {
      throw new ConvexError("Email address is invalid.");
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
      ...(args.mobilePhone?.trim() ? { mobilePhone: args.mobilePhone.trim() } : {}),
      ...(args.email?.trim() ? { email: args.email.trim() } : {}),
      ...(args.contactName?.trim() ? { contactName: args.contactName.trim() } : {}),
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
