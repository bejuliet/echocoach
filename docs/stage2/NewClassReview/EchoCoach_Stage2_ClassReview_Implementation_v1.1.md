# EchoCoach Stage 2 — New Class Review Implementation Contract
**v1.1 DRAFT — NOT APPROVED FOR IMPLEMENTATION** | 2026-10-16

## Authoritative references
- `../01_PRODUCT_DECISIONS.md` CR-01–CR-14
- Latest Level 3 Core Model WITH LEARNING PROFILE (2026-10-08) + dated Stage 2 amendment workbook
- Class Review Functional & UI Specification v1.1
- Existing Stage 1 review UI, Convex schema and mutations (inspect first; do not assume names)

## Non-negotiable invariants
1. Scope all queries/mutations to authenticated coach; filter class series by activeSportId.
2. ClassSession business uniqueness `(classSeriesId, sessionSequenceNumber)`; stable internal ID; date is mutable, never key.
3. Student and Session are independent children of Series. Changing Series invalidates both; changing Student rechecks existing review only.
4. `plannedDate?: date` is separate from actual `sessionDate?: date`; review save requires actual date.
5. Saved review uniqueness `(classSessionId, studentId)`; existing → edit route, no duplicate create.
6. `ClassSession.sessionDate` owns actual date; transactionally sync ClassReview and SessionParticipation copies when corrected.
7. Attendance and review are independent. Do not mark entire group attended when first review is saved.
8. Student attended-sequence calculation must respect Student+Sport baseline and attendance corrections.
9. Do not change Stage 1 historical records' dates using review createdAt.

## Proposed service boundaries (adapt to existing code)
- `listSeriesForCoachSport(coachId, sportId)`
- `listStudentsForSeries(classSeriesId)`
- `listSessionsForSeries(classSeriesId)` sorted descending by sequence; date labels built in UI
- `getReviewForStudentSession(classSessionId, studentId)`
- `prepareNewSessionContext(classSeriesId)` proposes next sequence for display, but does not reserve it without a server mutation
- `saveClassReviewWithContext(...)` validates all relationships, confirmed date, uniqueness; optionally creates Session/Participations; writes Review; marks selected student attended; propagates date; commits atomically
- `correctSessionDate(...)` explicitly authorized; propagates to all linked records atomically
- `updateAttendance(...)` explicit per-student group attendance, recalculates student sequence if needed
- `logCompletedSession(...)` separate Classes workflow; do not expose unreviewed booking assumptions

## Workflow state
`activeSportId` inherited; `classSeriesId`, `studentId`, `classSessionId | createNew`, `confirmedSessionDate`, `dateConfirmed`, `sharedActivities`, `studentProgress`, `nextSteps`, `generationDraft`, `dirty`, `saveState`.
On series change reset student/session/date and shared content. On student change preserve session and shared activities, reset individual fields; recheck review. Never create duplicate sessions on retry or double-click.

## Transaction design cautions
If session is quick-created before review save, define abandoned-session behavior. Prefer atomic create-on-save or a deliberate reserved-draft state after product approval. Concurrency must not assign duplicate sequence numbers. Corrections require warning/authorization and transactional copy propagation. Explicitly test two coaches/devices, simultaneous create and retry.

## Test matrix
- existing planned session (date blank), planned session (plannedDate present), already completed session, new session
- first/last session, no sessions, 50+ sessions, date changed, correction with multiple reviews
- existing student review vs new, group 3 students with mixed attendance, switching student/series/sport
- lost network during transcription/generation/save, duplicate submission, stale data, denied coach access
- review date required; plannedDate alone insufficient; baseline sequence corrections; legacy cutover

## No implementation without
Review of current source routes/components, Convex tables/indexes, mutation names, Stage 1 review field shapes, migration plan, local integration guardrails, and explicit approval of open functional decisions. Do not deploy or migrate live data based solely on this draft.

## v1.1 post-save group attendance and navigation contract (approved design)
- Keep review steps strictly 1 Class Context → 2 Shared Activities → 3 Student Progress → 4 Next Steps, AI review, approval and Save. **Never** insert group roster before saving the initially selected student's review.
- On successful Step 4 Save: for 1:1 display success/Finish only; for group display **Review Other Students from This Session** as a post-save continuation, NOT numbered Step 5. Show the just-reviewed student as `attended` / `review saved`.
- Query all series-member participation rows, including unresolved students. Display review state independently of `attendanceStatus` (`unknown | attended | absent`). Actions: Start Review, Absent, and secondary Mark Attended without Review. Reviewed student gets View/Edit; absent student gets Change/Undo.
- `Absent`: server-side `updateAttendance(classSessionId,studentId,'absent')` with membership/coach authorization; do not create ClassReview or assign studentSequenceNumber. Do not allow changing an already-reviewed attended student to absent without a confirmation and explicit review-conflict resolution.
- `Mark Attended`: `updateAttendance(...,'attended')`, calculate Student+Sport studentSequenceNumber using baseline and chronological ordering; no review required. Corrected attendance must recalculate affected subsequent attended sequence values.
- `Start Review` for another student: preserve series, session, actual date and shared activities; copy Step 2 content into this student's review draft (editable); clear personal progress/next steps; navigate directly to Step 3, with optional access back to Step 2. Existing review should open View/Edit instead of creating duplicate.
- `Finish` or `Back to Home` with `unknown` participations: show explicit count warning and require acknowledgement; allow exit; do not convert unknown to absent or mark session completed. Confirmed actual session date plus all attendance resolved is required to transition `ClassSession.status` to `completed`.
- Use existing `SessionParticipation` fields (`classSessionId`, `studentId`, `sportId`, `sessionDate`, `attendanceStatus`, conditional `studentSequenceNumber`). No `attended` boolean, `reviewId`, `notes`, or `excused` enum is authorized by visual concepts.
- Save and attendance mutations should be idempotent, enforce one participation per student/session, and re-evaluate session completion after each attendance change. Handle concurrent updates and stale roster state.

### Additional v1.1 acceptance tests
1. 1:1 review saves and skips group roster.
2. Group review completes Steps 1–4 before roster appears; saved student's attendance is attended.
3. Other student marked absent: no review created, no student sequence assigned.
4. Other student marked attended without review: sequence assigned, no review created.
5. Remaining unknown: warning count correct; exit allowed; session not completed.
6. All attendance resolved with confirmed date: session completed, regardless of missing reviews.
7. Start next student's review at Step 3; shared activities prefilled/editable; no prior student's individual notes carried over.
8. Absent↔attended correction reorders Student+Sport sequence correctly; conflicting existing review is protected.
9. Repeated taps/retries do not create duplicate Participation/Review or duplicate sequences.
