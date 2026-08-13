import { mutation, query } from "./_generated/server";

const BASELINE_THROUGH_DATE = "2026-08-12";

type StudentSeed = {
  studentId: string;
  name: string;
  status: "Active" | "Inactive";
  startDate: string;
  baselineClassesTaken: number;
  baselineThroughDate: string;
  notes?: string;
};

type ClassSeed = {
  classId: string;
  displayName: string;
  memberStudentIds: string[];
  classType: "1:1" | "1:2";
  status: "Active" | "Inactive";
  cycle: string;
};

const INITIAL_STUDENTS: StudentSeed[] = [
  {
    studentId: "stu_Max",
    name: "Max",
    status: "Active",
    startDate: "2026-06-24",
    baselineClassesTaken: 7,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Harper",
    name: "Harper",
    status: "Active",
    startDate: "2026-08-12",
    baselineClassesTaken: 1,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Silias",
    name: "Silias",
    status: "Active",
    startDate: "2026-08-12",
    baselineClassesTaken: 1,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Queenie",
    name: "Queenie",
    status: "Active",
    startDate: "2026-05-17",
    baselineClassesTaken: 9,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Elaine",
    name: "Elaine",
    status: "Active",
    startDate: "2026-06-17",
    baselineClassesTaken: 2,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Griz",
    name: "Griz",
    status: "Active",
    startDate: "2026-05-03",
    baselineClassesTaken: 9,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Eluna",
    name: "Eluna",
    status: "Active",
    startDate: "2026-08-11",
    baselineClassesTaken: 1,
    baselineThroughDate: BASELINE_THROUGH_DATE,
  },
  {
    studentId: "stu_Aiden",
    name: "Aiden",
    status: "Inactive",
    startDate: "2026-05-12",
    baselineClassesTaken: 6,
    baselineThroughDate: BASELINE_THROUGH_DATE,
    notes: "potential comeback in Sept 2026",
  },
];

const INITIAL_CLASSES: ClassSeed[] = [
  {
    classId: "class_Max",
    displayName: "Max Class",
    memberStudentIds: ["stu_Max"],
    classType: "1:1",
    status: "Active",
    cycle: "Weekly",
  },
  {
    classId: "class_Harper_Silias",
    displayName: "Harper & Silias Class",
    memberStudentIds: ["stu_Harper", "stu_Silias"],
    classType: "1:2",
    status: "Active",
    cycle: "Weekly",
  },
  {
    classId: "class_Queenie_Elaine",
    displayName: "Queenie & Elaine  Class",
    memberStudentIds: ["stu_Queenie", "stu_Elaine"],
    classType: "1:2",
    status: "Active",
    cycle: "Weekly",
  },
  {
    classId: "class_Aiden",
    displayName: "Aiden Class",
    memberStudentIds: ["stu_Aiden"],
    classType: "1:1",
    status: "Inactive",
    cycle: "Weekly",
  },
  {
    classId: "class_Griz_Eluna",
    displayName: "Griz & Eluna Class",
    memberStudentIds: ["stu_Griz", "stu_Eluna"],
    classType: "1:2",
    status: "Active",
    cycle: "Weekly",
  },
];

// Safe to rerun: application-level ids are indexed and existing rows are
// patched rather than duplicated. Historical reviews are only linked when the
// stored free-text name exactly matches one canonical student name after
// trimming and case normalization.
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    for (const student of INITIAL_STUDENTS) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_studentId", (q) => q.eq("studentId", student.studentId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, student);
      } else {
        await ctx.db.insert("students", student);
      }
    }

    for (const classGroup of INITIAL_CLASSES) {
      const existing = await ctx.db
        .query("classes")
        .withIndex("by_classId", (q) => q.eq("classId", classGroup.classId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, classGroup);
      } else {
        await ctx.db.insert("classes", classGroup);
      }
    }

    const studentIdByName = new Map(
      INITIAL_STUDENTS.map((student) => [
        normalizeName(student.name),
        student.studentId,
      ]),
    );
    const reviews = await ctx.db.query("reviews").collect();
    let reviewsBackfilled = 0;
    const unmappedReviewNames = new Set<string>();

    for (const review of reviews) {
      if (review.studentId) continue;
      const studentId = studentIdByName.get(normalizeName(review.studentName));
      if (studentId) {
        await ctx.db.patch(review._id, { studentId });
        reviewsBackfilled += 1;
      } else {
        unmappedReviewNames.add(review.studentName);
      }
    }

    return {
      studentsInitialized: INITIAL_STUDENTS.length,
      classesInitialized: INITIAL_CLASSES.length,
      reviewsBackfilled,
      unmappedReviewNames: Array.from(unmappedReviewNames).sort(),
    };
  },
});

// Read-only preview for auditing before initialize is run on a deployment.
export const previewBackfill = query({
  args: {},
  handler: async (ctx) => {
    const studentIdByName = new Map(
      INITIAL_STUDENTS.map((student) => [
        normalizeName(student.name),
        student.studentId,
      ]),
    );
    const reviews = await ctx.db.query("reviews").collect();
    const mappable = reviews.filter(
      (review) =>
        !review.studentId &&
        studentIdByName.has(normalizeName(review.studentName)),
    );
    const unmapped = reviews.filter(
      (review) =>
        !review.studentId &&
        !studentIdByName.has(normalizeName(review.studentName)),
    );

    return {
      mappableReviewCount: mappable.length,
      unmappedReviews: unmapped.map((review) => ({
        reviewId: review._id,
        studentName: review.studentName,
        createdAt: review.createdAt,
      })),
    };
  },
});

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}
