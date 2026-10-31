import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAuthenticatedCoach, requireCoachSportAccess, requireStudentAccess } from "./authorization";

export const currentCoach = query({
  args: {},
  handler: async (ctx) => {
    const coach = await requireAuthenticatedCoach(ctx);
    return { coachId: coach._id, name: coach.name, status: coach.status };
  },
});

export const authorizedSports = query({
  args: {},
  handler: async (ctx) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const relationships = await ctx.db.query("coachSports").withIndex("by_coach", (q) => q.eq("coachId", coach._id)).collect();
    const sports = await Promise.all(relationships.map((row) => ctx.db.get(row.sportId)));
    return sports.filter((sport): sport is NonNullable<typeof sport> => sport?.status === "active").map((sport) => ({ sportId: sport._id, name: sport.name }));
  },
});

export const authorizedStudents = query({
  args: {},
  handler: async (ctx) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const relationships = await ctx.db.query("coachSports").withIndex("by_coach", (q) => q.eq("coachId", coach._id)).collect();
    const sportIds = new Set(relationships.map((row) => row.sportId));
    const enrollments = (await Promise.all([...sportIds].map((sportId) => ctx.db.query("studentSports").withIndex("by_sport", (q) => q.eq("sportId", sportId)).collect()))).flat();
    const unique = new Map<string, { studentId: string; name: string; sports: string[] }>();
    for (const enrollment of enrollments) {
      const student = await ctx.db.get(enrollment.studentId);
      const sport = await ctx.db.get(enrollment.sportId);
      if (!student || !sport) continue;
      const current = unique.get(student._id) ?? { studentId: student._id, name: student.name, sports: [] };
      if (!current.sports.includes(sport.name)) current.sports.push(sport.name);
      unique.set(student._id, current);
    }
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const authorizedStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const coach = await requireAuthenticatedCoach(ctx);
    const student = await requireStudentAccess(ctx, coach._id, args.studentId);
    const enrollments = await ctx.db.query("studentSports").withIndex("by_student", (q) => q.eq("studentId", args.studentId)).collect();
    const sports = [];
    for (const enrollment of enrollments) {
      try {
        const sport = await requireCoachSportAccess(ctx, coach._id, enrollment.sportId);
        sports.push({ sportId: sport._id, name: sport.name });
      } catch (error) {
        if (!(error instanceof ConvexError)) throw error;
      }
    }
    return { studentId: student._id, name: student.name, status: student.status, mobilePhone: student.mobilePhone, email: student.email, contactName: student.contactName, sports };
  },
});
