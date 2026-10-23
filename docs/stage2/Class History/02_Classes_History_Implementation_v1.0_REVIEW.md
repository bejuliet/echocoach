# EchoCoach Stage 2 — Classes & History Implementation Specification
**v1.0 · FOR REVIEW · 2026-10-22 · Not approved for coding**

## 1. Authority and invariants
- Coach ownership and activeSportId enforced server-side. Class Series unique by coachId + sportId + normalized student set, regardless of active state, name, schedule or location.
- ClassSession internal ID stable. Display sessionSequenceNumber assigned by creation order within series. Changing plannedDate or sessionDate never changes number; deleting an eligible session decrements all greater sequence numbers atomically.
- ClassSession.sessionDate is confirmed actual date source of truth; transactional denormalization to ClassReview and SessionParticipation. plannedDate separate and optional. Completed requires actual date and resolved attendance, not merely past planned date.

## 2. Proposed persistence and indexes
- Recurring time slots belong to Class Series, each with weekday, startTime, endTime, frequencyWeeks integer 1..4 and anchorDate. Choose embedded array or separate table after inspecting existing schema; do not add booking/session auto-generation.
- Indexes/queries: series by coach/sport/status, series membership by student, sessions by series/sequence, plans by series/session, reviews by series/student/session/date, media by session and student tags. Verify exact existing names before implementation.
- Media stores one asset linked to one classSessionId and a set of studentIds (possibly empty). Student tags must be a subset of series membership; avoid duplicate storage of binary assets.

## 3. Mutation boundaries
### saveSeries
Validate locked student set, recurrence weekday/anchor and time ranges; reject duplicate student-set series. Editing recurring slots affects future suggestions only.
### createSession
Authorize series, allocate next sequence atomically with concurrency-safe uniqueness, persist even if no plan/review. Optional plannedDate. Idempotency/retry protection.
### updateSessionDates
Authorize; plannedDate editable without completion implications. Actual date edits require explicit correction flow and atomically propagate to all related date copies. Preserve sequence.
### deleteEmptySession
Require explicit UI confirmation. In one server transaction, reject any linked ClassPlan, ClassReview, SessionParticipation or media; delete target and decrement greater sequence values. Handle unique-index collision safely (transaction strategy or temporary ordering), stale client state and concurrent creates.
### listSessions
All sessions, descending sequence, including undated/empty. Compute labels from confirmed date, attendance and plan/review existence; do not use calendar date to claim completed.
### listArchives
Apply coach/sport and cascading filters; exclude records that do not exist; stable newest-first paging in batches of two; avoid duplicates across pages.
### uploadMediaContext
Resolve series/session, enforce coach ownership, validate zero-or-more student tags; upload details are separate Media design.

## 4. Entry-point integration
- New Plan: Home, Archive and Class context prefill classSeriesId/classSessionId when available; session selector offers existing or immediate Create New; no plan auto-created by session creation.
- New Review: Home, Review History and session context prefill series/student/session as applicable; existing review routes to View/Edit; post-class review confirms actual date and student attendance; optional session-scoped media upload entry.
- Gallery: entry from Classes, student profile, session context; upload requires known session; no direct upload action newly added to Class Plan.

## 5. Required acceptance tests
- Concurrent session create; session creation without plan/review; delete empty middle session and renumber; reject delete with each dependency type; IDs and linked data unchanged; edit dates with no renumber; actual date copy propagation.
- Weekly, biweekly, 3-week and 4-week independent slots; anchor weekday validation; multiple slots same series; recurrence changes do not rewrite sessions; suggestions overrideable and do not auto-create sessions.
- Archives prefill and pagination; group reviews remain individual cards; plans have no student filter; untagged and multi-tagged media filtering; cross-sport and cross-coach authorization.
- Stage 1 legacy baselines and student attended-sequence correction must remain intact; session sequence renumbering is distinct from student attended sequence.

## 6. Deferred and implementation gates
- Media transport/storage/delete, student sharing, automatic booking, notifications, Today’s Classes alerts, and full scheduling automation deferred.
- Before coding inspect actual Convex tables, schema/indexes, existing Class Plan/Review implementations and Stage 1 migration behavior. Do not assume proposed function names are existing API.