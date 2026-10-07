import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The data model for EchoCoach.
// A "review" is one completed post-class message. We keep the coach's four
// raw answers AND the final polished message, so we can re-polish or show
// history later without losing the original input.
export default defineSchema({
  students: defineTable({
    studentId: v.optional(v.string()),
    name: v.string(),
    status: v.union(
      v.literal("Active"),
      v.literal("Inactive"),
      v.literal("active"),
      v.literal("inactive"),
    ),
    startDate: v.optional(v.string()),
    baselineClassesTaken: v.optional(v.number()),
    baselineThroughDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_studentId", ["studentId"]),

  sports: defineTable({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_name", ["name"]),

  coaches: defineTable({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
  }).index("by_name", ["name"]),

  coachSports: defineTable({
    coachId: v.id("coaches"),
    sportId: v.id("sports"),
  })
    .index("by_coach", ["coachId"])
    .index("by_sport", ["sportId"])
    .index("by_coach_sport", ["coachId", "sportId"]),

  studentSports: defineTable({
    studentId: v.id("students"),
    sportId: v.id("sports"),
    sequenceBaseline: v.number(),
    stage2StartedAt: v.optional(v.number()),
  })
    .index("by_student", ["studentId"])
    .index("by_sport", ["sportId"])
    .index("by_student_sport", ["studentId", "sportId"]),

  classSeries: defineTable({
    coachId: v.id("coaches"),
    sportId: v.id("sports"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    usualDayOfWeek: v.optional(v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday"),
    )),
    usualStartTime: v.optional(v.string()),
    usualEndTime: v.optional(v.string()),
  })
    .index("by_coach_status", ["coachId", "status"])
    .index("by_coach_sport_status", ["coachId", "sportId", "status"]),

  classSeriesStudents: defineTable({
    classSeriesId: v.id("classSeries"),
    studentId: v.id("students"),
  })
    .index("by_student", ["studentId"])
    .index("by_classSeries", ["classSeriesId"])
    .index("by_series_student", ["classSeriesId", "studentId"]),

  classSessions: defineTable({
    classSeriesId: v.id("classSeries"),
    sessionSequenceNumber: v.number(),
    status: v.union(
      v.literal("planned"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    sessionDate: v.optional(v.string()),
  }).index("by_series_sequence", ["classSeriesId", "sessionSequenceNumber"]),

  sessionParticipations: defineTable({
    classSessionId: v.id("classSessions"),
    studentId: v.id("students"),
    sportId: v.id("sports"),
    sessionDate: v.optional(v.string()),
    attendanceStatus: v.union(
      v.literal("unknown"),
      v.literal("attended"),
      v.literal("absent"),
    ),
    studentSequenceNumber: v.optional(v.number()),
  })
    .index("by_session_attendance", ["classSessionId", "attendanceStatus"])
    .index("by_student", ["studentId"])
    .index("by_student_sport_sequence", [
      "studentId",
      "sportId",
      "studentSequenceNumber",
    ])
    .index("by_student_date", ["studentId", "sessionDate"])
    .index("by_student_sport_date", ["studentId", "sportId", "sessionDate"])
    .index("by_session_student", ["classSessionId", "studentId"]),

  classReviews: defineTable({
    classSessionId: v.id("classSessions"),
    studentId: v.id("students"),
    sessionDate: v.string(),
    reviewContent: v.string(),
  })
    .index("by_student_date", ["studentId", "sessionDate"])
    .index("by_session_student", ["classSessionId", "studentId"]),

  classPlans: defineTable({
    classSessionId: v.id("classSessions"),
    classGoal: v.optional(v.string()),
    classDrills: v.optional(v.string()),
  }).index("by_classSessionId", ["classSessionId"]),

  mediaAssets: defineTable({
    sessionParticipationId: v.id("sessionParticipations"),
    type: v.union(v.literal("photo"), v.literal("video")),
    storageReference: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_sessionParticipation", ["sessionParticipationId"]),

  legacyStage1Reviews: defineTable({
    legacyReviewId: v.string(),
    studentId: v.optional(v.id("students")),
    studentName: v.string(),
    classNumber: v.optional(v.number()),
    whatWeDid: v.string(),
    progress: v.string(),
    nextSteps: v.string(),
    message: v.string(),
    createdAt: v.number(),
    sourceTable: v.literal("reviews"),
    migratedAt: v.number(),
  })
    .index("by_student_createdAt", ["studentId", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_legacyReviewId", ["legacyReviewId"]),

  classes: defineTable({
    classId: v.string(),
    displayName: v.string(),
    memberStudentIds: v.array(v.string()),
    students: v.optional(v.string()),
    classType: v.union(v.literal("1:1"), v.literal("1:2"), v.literal("1:3"), v.literal("1:4")),
    status: v.union(v.literal("Active"), v.literal("Inactive")),
    cycle: v.string(),
  }).index("by_classId", ["classId"]),

  reviews: defineTable({
    studentId: v.optional(v.string()), // stable identity for seeded students
    classNumber: v.optional(v.number()), // fixed sequence number once saved
    studentName: v.string(), // who the class was for
    whatWeDid: v.string(), // answer 1: what we did in the class
    progress: v.string(), // answer 2: what the progress was
    nextSteps: v.string(), // answer 3: next steps and practice
    message: v.string(), // the final, approved review message
    createdAt: v.number(), // ms timestamp, used for ordering the log
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_studentId", ["studentId"])
    .index("by_studentId_createdAt", ["studentId", "createdAt"]),
});
