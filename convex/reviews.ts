import { query, mutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";

// Read every saved review, newest first.
// We use the `by_createdAt` index (defined in schema.ts) and order it
// descending so the most recent review shows up at the top of the Log page.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const nextClassNumber = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, { studentId }) => {
    return await computeNextClassNumber(ctx, studentId);
  },
});

// Save a finished review to the database.
// Every argument is validated with the `v` validators so we never store
// malformed data. `createdAt` is set on the server with the current time.
export const create = mutation({
  args: {
    studentId: v.optional(v.string()),
    studentName: v.string(),
    whatWeDid: v.string(),
    progress: v.string(),
    nextSteps: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { studentId: requestedStudentId, ...reviewFields } = args;
    let studentId: string | undefined;
    let studentName = args.studentName;

    if (requestedStudentId) {
      const student = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q) =>
          q.eq("studentId", requestedStudentId),
        )
        .unique();
      if (!student || student.status !== "Active") {
        throw new ConvexError("Please select an active student.");
      }
      assertStage1ReviewCompatibility(student);
      await assertNotCutOverToStage2(ctx, student._id);
      studentId = student.studentId;
      studentName = student.name;
    } else {
      // Backward-compatible fallback for older/internal callers that do not
      // yet provide a stable student id.
      const normalizedName = normalizeName(args.studentName);
      const students = await ctx.db.query("students").collect();
      const matchingStudents = students.filter(
        (student) => normalizeName(student.name) === normalizedName,
      );
      if (matchingStudents.length === 1) {
        const matchedStudent = matchingStudents[0];
        assertStage1ReviewCompatibility(matchedStudent);
        await assertNotCutOverToStage2(ctx, matchedStudent._id);
        studentId = matchedStudent.studentId;
        studentName = matchedStudent.name;
      }
    }

    const classNumber = studentId
      ? await computeNextClassNumber(ctx, studentId)
      : undefined;

    return await ctx.db.insert("reviews", {
      ...reviewFields,
      studentId,
      studentName,
      classNumber,
      createdAt: Date.now(),
    });
  },
});

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export async function assertNotCutOverToStage2(
  ctx: MutationCtx,
  studentId: Id<"students">,
) {
  const tennis = await ctx.db
    .query("sports")
    .withIndex("by_name", (q) => q.eq("name", "Tennis"))
    .unique();
  if (!tennis) return;

  const studentSport = await ctx.db
    .query("studentSports")
    .withIndex("by_student_sport", (q) =>
      q.eq("studentId", studentId).eq("sportId", tennis._id),
    )
    .unique();
  if (studentSport?.stage2StartedAt !== undefined) {
    throw new ConvexError(
      "This Student's Tennis workflow has moved to Stage 2.",
    );
  }
}

function assertStage1ReviewCompatibility(
  student: {
    studentId?: string;
    baselineClassesTaken?: number;
    baselineThroughDate?: string;
  },
): asserts student is {
  studentId: string;
  baselineClassesTaken: number;
  baselineThroughDate: string;
} {
  if (
    !student.studentId ||
    student.baselineClassesTaken === undefined ||
    student.baselineThroughDate === undefined
  ) {
    throw new ConvexError(
      "This student is not configured for Stage 1 reviews.",
    );
  }
}

async function computeNextClassNumber(
  ctx: QueryCtx | MutationCtx,
  studentId: string,
) {
  const student = await ctx.db
    .query("students")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .unique();
  if (!student) {
    throw new ConvexError("Student not found.");
  }
  return (await calculateStage1SequenceBaseline(ctx, studentId)) + 1;
}

export async function calculateStage1SequenceBaseline(
  ctx: Pick<QueryCtx, "db">,
  studentId: string,
) {
  const student = await ctx.db
    .query("students")
    .withIndex("by_studentId", (q) => q.eq("studentId", studentId))
    .unique();
  if (!student) throw new ConvexError("Student not found.");
  assertStage1ReviewCompatibility(student);

  // baselineThroughDate includes the full stated calendar date. Reviews must
  // be strictly later than its UTC end-of-day boundary to qualify.
  const baselineEnd = Date.parse(`${student.baselineThroughDate}T23:59:59.999Z`);
  const qualifyingReviews = await ctx.db
    .query("reviews")
    .withIndex("by_studentId_createdAt", (q) =>
      q.eq("studentId", studentId).gt("createdAt", baselineEnd),
    )
    .collect();

  return student.baselineClassesTaken + qualifyingReviews.length;
}

// Permanently remove one saved review. The document id validator ensures this
// mutation can only target a record in the reviews table.
export const remove = mutation({
  args: {
    reviewId: v.id("reviews"),
  },
  handler: async (ctx, { reviewId }) => {
    await ctx.db.delete(reviewId);
  },
});
