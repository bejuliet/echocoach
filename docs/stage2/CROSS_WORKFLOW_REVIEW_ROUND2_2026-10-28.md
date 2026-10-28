# EchoCoach Stage 2 — Cross-Workflow Review, Round 2
**Date:** 2026-10-28  
**Status:** Findings and proposed resolutions for decision; no schema migration performed.

## A. ClassSession dates
**Approved:** `ClassSession.plannedDate` is optional and may be supplied in a Class Plan or session management; `ClassSession.sessionDate` is the actual occurrence date, confirmed by review or explicit session logging. Creating a session does not automatically set `sessionDate`. Old `scheduledDate` references are superseded. Actual-date correction must update denormalized `SessionParticipation.sessionDate` and `ClassReview.sessionDate` without changing Class Session identity or sequence number. Completing a session requires a confirmed actual date and resolved attendance for all participations; calendar date alone is not sufficient.

**Schema/implementation checks:** remove or migrate old `scheduledDate`; make `plannedDate` and `sessionDate` distinct and optional until their respective workflow gates; propagate date changes transactionally; define correction audit; verify use in History and sort order. Do not use `plannedDate` as evidence of attendance.

**Status:** Product behavior already approved. Physical schema/code reconciliation outstanding.

## B. Student deactivation versus permanent deletion
**Approved:** Student sport status is stored on `StudentSport.status`; only active and inactive students for the selected sport appear in its roster. Deactivating a student with an active 1:1 Class Series deactivates the series, preserving history. Group Class Series membership is identity-defining and must not silently mutate or delete shared data. Permanent student deletion is a distinct operation whose dependent-record rules remain unresolved.

**Proposed safety resolution for review:** Stage 2 should permit immediate, reversible sport deactivation; when student belongs to an active group series, show warnings and preserve its historical roster and all sessions/reviews/media, while preventing new activity until the group is explicitly closed and a replacement series is created for the remaining roster. For permanent deletion of any student with dependent sessions, reviews, media, or more than one sport, block the destructive operation pending a separately approved retention/detagging policy. This safeguard is a proposal, not an approved product rule. Clarify the lifecycle of global `Student.status` separately.

**Decision required:** Choose group-series deactivation behavior and whether permanent delete should be blocked when historical dependencies exist.

## C. Attendance and student sequence recalculation
**Approved:** One `ClassSession` has a sequence number within its `ClassSeries`. Group attendance is per `SessionParticipation` with `unknown` / `attended` / `absent` states. Review Save marks the student attended; attended-without-review is valid; absent creates no review or student class number; unresolved attendance remains unknown, with warning when leaving. A session is completed only when actual date is confirmed and all participation attendance statuses are resolved. `studentSequenceNumber` advances per Student + Sport across coaches, taking Stage 1 baseline and cutover rules into account. Attendance corrections require safeguards and sequence recalculation. Deleting an empty Session can compact later series session numbers without changing internal IDs.

**Implementation consistency checks:** recompute student sequence in actual occurrence order after date corrections and attendance changes; handle ties (two attended classes on the same date) through a deterministic ordering key; protect Stage 1 baseline and pre-cutover history; update affected reviews/participations transactionally or through safe retry; enforce unique per-student-per-session review and participation; check how `unknown` participates in counts; prevent absent when existing review remains without an explicit resolution path. Concurrency and audit mechanics remain pending.

**Decision required:** tie-breaker for same-day attended sessions across multiple coaches and the exact user-facing correction behavior when a review already exists.

## Cross-cutting deferred backlog
BACKLOG-INIT-01 — Coach-managed Student and Class Initialization is future scope. BACKLOG-MC-01 covers more robust shared Student + Sport multi-coach sequencing, learning profiles, concurrent editing and permissions.
