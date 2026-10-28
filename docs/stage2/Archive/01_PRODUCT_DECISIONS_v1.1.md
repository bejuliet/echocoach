# EchoCoach Stage 2 — Product Decisions Log

**Version:** 1.1 (Classes & History and cross-workflow integrations)  
**Updated:** 2026-10-23  
**Target folder:** `~/Projects/EchoCoach-Stage2/docs/stage2/`

**Legend:** Agreed = product decision made; Proposed = suggestion not approved; Open = unresolved; Deferred = later.

## A. Homepage — confirmed decisions
| ID | Status | Decision |
|---|---|---|
| HP-01 | Agreed | **Option A — Action First** homepage; minimal and action-oriented. |
| HP-02 | Agreed | Primary actions: **New Class Review** and **New Class Plan**. |
| HP-03 | Agreed | Bottom navigation: **Home / Classes / Students**. |
| HP-04 | Agreed | Preserve EchoCoach logo and sport-specific visual identity. |
| HP-05 | Deferred | Option C class-centric homepage until future booking provides upcoming-class visibility. |

### Sport configuration — SC-01 through SC-06 (agreed)
- **SC-01 Sport Selection:** Coach can select active sport from homepage.
- **SC-02 Sport-Specific Theme:** Changing sport updates visual theme, including homepage background and relevant workflow screens.
- **SC-03 Sport-Specific Configuration:** Changing sport updates workflow content, terminology, selectors and available records. Only records associated with selected sport appear in sport-specific workflows.
- **SC-04 Persistent Preference:** Selected sport is saved as coach's default, persists across sessions and devices until changed.
- **SC-05 Consistent Navigation:** Core navigation remains consistent across sports; differences are configuration-driven.
- **SC-06 Switching During Active Workflow:** Prevent loss of unsaved Class Review/Plan work. MVP recommendation: sport changes from homepage, with confirmation if unfinished work is affected; exact interaction to finalize.

### Homepage open / proposed items
| ID | Status | Detail |
|---|---|---|
| HP-O1 | Open | First login with no sport preference. |
| HP-O2 | Open | Final theme assets, colors, accessible contrast. |
| HP-O3 | Open | Destination routes and unfinished-feature behavior for Classes, Students and New Class Plan. |
| HP-O4 | Proposed | Persist preference on coach account; confirm against Convex schema. |
| HP-O5 | Proposed | Language control in Settings, not bottom navigation. |
| HP-O6 | Deferred | Recent Activity section. |

## B. Prior Stage 2 data-model decisions
*Summaries of previous discussions; verify against canonical domain model before implementing migrations.*

| ID | Status | Decision |
|---|---|---|
| DM-01 | Agreed | Core concepts: Sport, Coach, Student, Class Series, Class Session, Class Plan, Class Review, Media Asset, learning/capability profile. |
| DM-02 | Agreed | Class Series business identity = Coach + Sport + Student set. Student-set change creates new series; time-slot change does not. |
| DM-03 | Agreed | Class Session identity = Class Series + session sequence number, regardless of attendance/date. |
| DM-04 | Agreed | Class Plan can exist before a session; creating a plan can create its session. |
| DM-05 | Agreed | Class Review is per student per session. |
| DM-06 | Agreed | `ClassSession.sessionDate` is actual class date, confirmed during post-class review, not plan creation. Copies on SessionParticipation and ClassReview also use `sessionDate`. |
| DM-07 | Agreed | Attendance corrections allowed; student session sequence recalculated. |
| DM-08 | Agreed | Class Session can be created from plan or review; booking not required in Stage 2. |
| DM-09 | Agreed | Use `sessionSequenceNumber` and `studentSessionSequenceNumber`. |
| DM-10 | Agreed | Stage 1 incomplete history uses cutover baselines `baselineClassesTaken` and `baselineThroughDate`. |

## C. New Class Review — decisions agreed; v1.1 specification drafts awaiting approval
| ID | Status | Decision |
|---|---|---|
| CR-01 | Agreed | Preserve Stage 1 four-step review structure where feasible; Step 1 titled **Class Context**. |
| CR-02 | Agreed | Sport inherited from homepage; do not duplicate sport selection on Class Context. |
| CR-03 | Agreed | Progressive Class Series → Student → Class Session; Series filters both; Student does not filter Session. Changing Series resets dependent selections. |
| CR-04 | Agreed | Existing session can be selected; new session quick-create proposes next sequence number, allocated atomically by server. |
| CR-05 | Agreed | Business identity = Class Series + sessionSequenceNumber; actual date is editable and not part of key. |
| CR-06 | Agreed | Session selector labels `#7 · Oct 14 session`, newest sequence first, **no automatic selection**; undated planned sessions clearly labeled. |
| CR-07 | Agreed | Confirm actual sessionDate in Step 1; required before saving review. Existing confirmed date corrections require impact-warning dialog and explicit confirmation. |
| CR-08 | Agreed | ClassPlan may optionally supply `plannedDate` (new field); `sessionDate` remains actual-date source of truth and may be empty while only planned. |
| CR-09 | Agreed | Duplicate student/session review detected; View/Edit existing review rather than creating another. |
| CR-10 | Agreed | Guard unsaved work and preserve recorded/transcribed input where feasible; persistence details pending. |
| CR-11 | Agreed | Group class shared “What did we do?” text pre-filled and editable for subsequent students, copied into each student's independent review; progress and next steps captured per student. |
| CR-12 | Agreed | After successful first student Review Save in a group session, show **Review Other Students from This Session** as a post-save continuation (not an intervening numbered step); preserve series, session, date and shared content; attendance of other students confirmed independently. |
| CR-13 | Agreed | ClassSession can also be logged without Class Plan or Review; lightweight standalone Log Session under Classes with date and explicit attendance. No booking automation in Stage 2. |
| CR-14 | Agreed | Optional database field may become business-required at review-save transition; enforce via mutation validation. |
| CR-O1 | Open | Exact draft persistence / voice recovery strategy and Stage 1 review step mapping. |
| CR-O2 | Open | Whether quick-create session is persisted immediately or only atomically with review save; avoid abandoned/duplicate sessions. |
| CR-O3 | Open | Date correction policy when multiple reviews/participations exist, and explicit correction audit metadata. |
| CR-O4 | Open | Standalone Log Session workflow details, attendance corrections and completion transitions in Classes specification. |
| CR-O5 | Open | Group class shared-content source during partial drafts; copied content is independent once saved. |

### New Class Review v1.1 — agreed refinements (2026-10-16)
| ID | Status | Decision |
|---|---|---|
| CR-15 | Agreed | Preserve exactly four numbered review steps: (1) Class Context, (2) What Did We Do in Class?, (3) Progress in Class, (4) Next Steps & Review including AI generation/edit/approval/Save. |
| CR-16 | Agreed | **Review Other Students from This Session** appears only after saving the initially selected student's review in a group session. It is post-save continuation, not Step 3 or a numbered Step 5. |
| CR-17 | Agreed | For 1:1 sessions, skip the group roster and show review-saved success / Finish. |
| CR-18 | Agreed | Group roster displays review status separately from `SessionParticipation.attendanceStatus`; allow Start Review, Absent, and secondary Mark Attended without Review; existing reviewed student has View/Edit, absent student can Change/Undo. |
| CR-19 | Agreed | Saving a review marks that student `attended`; marking `absent` creates no review or student sequence; marking `attended` without a review is allowed. Unresolved remains `unknown`. |
| CR-20 | Agreed | Start another student's review from Step 3, keeping series/session/date and pre-filling editable shared Step 2 activities; individual progress/next steps must be new for that student. |
| CR-21 | Agreed | Coach can leave with unresolved group attendance after a clear warning with count and acknowledgement; unknown is not silently converted to absent. |
| CR-22 | Agreed | Session becomes `completed` only when actual date is confirmed and every participation is attended or absent; review completion for every student is not required. |
| CR-23 | Agreed | Attendance correction requires explicit safeguards for existing reviews and recalculation of affected Student+Sport sequence numbers. Existing Level 3 fields suffice; visual-only `attended` boolean, `reviewId`, `notes`, `excused` are NOT approved schema fields. |

### v1.1 specification status and outstanding design details
- **Status:** Functional/UI and Implementation v1.1 design **approved**; not authorization for Codex implementation.
- **Spec files:** `EchoCoach_Stage2_ClassReview_Functional_UI_v1.1_DRAFT.docx`; `EchoCoach_Stage2_ClassReview_Implementation_v1.1_DRAFT.md`; updated illustrative UI visual.
- **Still open:** CR-O1–CR-O5 above; recording recovery, exact persistence boundaries, correction audit behavior and separate standalone session logging specification remain to finalize.

## D. Design and implementation process
| ID | Status | Decision |
|---|---|---|
| PROC-01 | Agreed | Owner sketches → feedback/options → decisions → functional/UI and implementation specs + visuals. |
| PROC-02 | Agreed | Finish interconnected core specs before full UI implementation; read-only technical inspections/limited proofs allowed. |
| PROC-03 | Agreed | Cross-workflow review and schema reconciliation before incremental tested implementation. |
| PROC-04 | Agreed | Repository docs in `EchoCoach-Stage2/docs/stage2/`, ChatGPT Project reference copies. |
| PROC-05 | Agreed | Preserve separate integration workspace; no incidental merges/migrations/deployments. |

## E. Planned next specifications
**Design order:** New Class Review → New Class Plan → Classes/History → Students/Profiles → Authentication/Coach Account → Media → Cross-workflow review. **Implementation order** depends on technical prerequisites.

## Change log
- **2026-10-15 / v0.1:** Initial consolidated log, distinguishing agreed decisions from open implementation details and draft workflows.

- **2026-10-15 / v0.2:** Class Review decisions CR-01–CR-14 agreed; draft specifications created. Optional plannedDate and standalone logging recorded. Workbook updated without overwriting learning profile sheets.

- **2026-10-16 / v0.3:** Approved workflow refinements CR-15–CR-23: four-step review, post-save group roster, absent/attended-without-review actions, optional exit with unresolved warning, session completion and attendance integrity; registered v1.1 draft specs.

## F. New Class Plan v1.0 — approved decisions (2026-10-16)
| ID | Status | Decision |
|---|---|---|
| CP-01 | Approved | Homepage retains the agreed visual with **Home / Classes / Students** bottom navigation (three choices). |
| CP-02 | Approved | Main Class Plan storyboard has **four screens**: Homepage, Class Context, Create Class Plan, Review & Save. Existing Plan View/Edit is a separate return-user scenario, not Step 5. |
| CP-03 | Approved | Select Class Series then Class Session; no Student selector. Display enrolled roster and View Profile for each student. Sport inherited from Homepage. |
| CP-04 | Approved | New Class Session persists immediately on confirmation with server-assigned next sequence; optional `plannedDate`. A session may exist without plan or review. |
| CP-05 | Approved | All three fields on **one scrollable editor screen** with simultaneous text and voice support: Q1 Goal, Q2 Agenda, Q3 optional single free-text Student Notes. No per-student note entities or name parsing. |
| CP-06 | Approved | AI suggestions generated automatically once context is selected; use available learning information, preserve coach edits and permit manual fallback. Detailed context/quality rules deferred to Learning Profile design and realistic test cases. |
| CP-07 | Approved | Review & Save triggers automatic **language polishing** for precision, grammar and concision without changing coach intent; coach reviews/edits and explicitly saves. |
| CP-08 | Approved | Simple Save: **no Draft/Final statuses**. Q1/Q2/Q3 may be empty. Coach may return to finish/edit same Class Plan; one per session. |
| CP-09 | Approved | If plan already exists for selected session, View/Edit existing plan; no duplicate; changing plan never automatically modifies saved Class Reviews. |
| CP-10 | Approved product requirement / pending physical schema review | Add minimal optional `ClassPlan.studentNotes` text to support Q3; existing Level 3 `classGoal` and `classDrills` retained. Validate schema and migration at cross-workflow review; no schema deployment now. |
| CP-11 | Approved | New Class Session creation is independent of Class Plan upsert. Revise original combined `createClassPlan` lifecycle contract accordingly while preserving per-operation atomicity and uniqueness. |

### Deferred (not blocking approval of Class Plan UX)
- AI context selection, group capability balancing, stale or conflicting learning information, generation quality thresholds and test fixtures (5–10 realistic cases): Students & Profiles and integration review.
- Physical schema migration, existing code compatibility and API naming: pre-implementation review.
- Existing New Class Review open implementation details remain tracked separately.

## Change log (continuation)
- **2026-10-16 / v0.4:** Approved CP-01–CP-11; corrected 4-screen visual and 3-choice homepage; clarified no draft status and optional Q3 data amendment.


## G. Classes & History — approved 2026-10-23 (v0.5)
| ID | Status | Decision |
|---|---|---|
| CH-01 | Approved | Classes landing is Class Series-first: coach greeting, active Class Series count and active student count, series cards with location, status and completed session count. Four per-series actions: Manage Class, Review History, Class Plans, Gallery. |
| CH-02 | Approved | Manage Class replaces Edit; two tabs Class Series and Sessions. Student set locked; name/location/schedule editable. |
| CH-03 | Approved | Series creation supports inline Add New Student and optional multiple recurring time slots. Suggested name auto-updates until manually edited. |
| CH-04 | Approved | Each recurring slot has weekday, separate start/end controls, independent frequency 1–4 weeks and matching anchor date. No automatic sessions. Changes affect future suggestions only. |
| CH-05 | Approved | Series unique by coach + sport + normalized exact student set even if inactive; duplicate opens existing/reactivate path. Deactivate/reactivate retains history. |
| CH-06 | Approved | Sessions tab lists all sessions newest creation-sequence first, no status filter/accordion; inline status, plan and review indicators; New Session and per-row Edit. |
| CH-07 | Approved | Session create may occur from Classes/Manage Class, New Class Plan or New Class Review; immediately persists independent of Plan or Review. |
| CH-08 | Approved | Session dates editable (planned or occurred). Date change does not renumber. Actual sessionDate corrections propagate to denormalized ClassReview/SessionParticipation dates; completed status not inferred from calendar date alone. |
| CH-09 | Approved | Delete Session requires confirmation; only empty sessions (no plan/review/participation/media) are eligible. Deletion atomically decrements higher sessionSequenceNumber values; stable internal IDs and links remain intact. |
| CH-10 | Approved | Universal Review History: sport-scoped; Series → Student → Session filters; individual student review cards (including group lessons), newest first, two initially then two per Load More; exclude sessions without reviews; prefill entry context and preserve return state. |
| CH-11 | Approved | Universal Class Plan Archive: Series and Session filters only (no Student); one plan per card; upcoming and completed; two initially then two per Load More; only saved plans; View/Edit and New Class Plan. |
| CH-12 | Approved | Universal Gallery: Series, Student, Session, Media Type filters; newest-first media grid, full-screen viewer; one asset per session with zero-or-more student tags, including multi-student and untagged assets. |
| CH-13 | Approved | Upload entry points from Session context, Class Review and Gallery; no new direct Class Plan upload. Detailed upload/storage/deletion and student-facing sharing deferred to separate Media design. |
| CH-14 | Approved | Review History offers New Class Review; Plan Archive offers New Class Plan; preserve selected Series/Student/Session context where relevant, with no auto-creation of Plan/Review on Session creation. |
| CH-15 | Approved | Visual Concept v1.3 preserves original screenshot captures; later decisions are noted in commentary if screenshot labels are superseded. |

### Existing workflow impact — approved
- **New Class Plan v1.1**: retains approved v1.0 four-phase workflow and AI editing. Unified session select/create, Archive entry prefill, no Student selector, no automatic Plan creation upon Session creation.
- **New Class Review v1.2**: retains v1.1 four-step workflow, per-student review, attendance and group continuation. Unified session select/create, History entry prefill and optional session-associated media upload.
- **Media**: Gallery association semantics are approved; transport/storage/retention/deletion remain open for the Media workflow.

### Technical decisions pending code/schema inspection (not product design reopenings)
- Embedded recurring slot objects vs separate collection; exact Convex indexes and mutation names.
- Concurrency-safe sequence compaction algorithm and retry semantics.
- Actual-date correction authorization/audit mechanics; media storage schema and deletion lifecycle.
- Verify Stage 1 baseline preservation, existing physical schema and migration before coding.

## Change log (v0.5)
- **2026-10-23:** Approved CH-01–CH-15 and cross-workflow Plan v1.1 / Review v1.2 changes; aligned workbook and Master Index; documentation validation performed with implementation checks explicitly deferred.


## H. Students & Profiles — approved Functional/UI (2026-10-24 / v0.6)

The rules below supplement the approved v0.5 CH/CP/CR decisions. They do not imply a completed schema migration or implemented mutations.

| ID | Status | Decision |
|---|---|---|
| STU-01 | Approved | Student roster is selected-sport scoped; active and inactive appear together, active first, with explicit status labels and search. |
| STU-02 | Approved | Card displays student name/ID, descriptive active Class Series (not series count), next milestone and total attended class count; direct actions Edit, History, Gallery and Learning Profile. |
| STU-03 | Approved | Create Student requires name; DOB, photo and notes optional; learning goals not included. Student ID is stable; generation/manual input rule needs technical verification. |
| STU-04 | Approved | Class Series creation is optional after Student creation; reuse approved CH-03 Class Series form, preselect new student, support group 1:1–1:4. |
| STU-05 | Approved | A Student may be in multiple sports with separate sport-specific status and learning profile; only current sport shown. |
| STU-06 | Approved | DOB may be added/changed/cleared in Add/Edit Student; age is calculated for display, never persisted separately. |
| STU-07 | Approved | Edit supports name/photo/notes and sport status; immutable Student ID; linked Class Series navigation. |
| STU-08 | Approved | Deactivating a student with an active 1:1 Class Series automatically deactivates the associated series and retains historical records. Group series handling remains TBD, not an assumed automatic cascade. |
| STU-09 | Approved intention / safety rule pending | Permanent delete is separate from deactivation; target student records should be removed with explicit warning, but group-shared sessions, reviews and media of other students must not be destroyed. Multi-sport and dependency deletion rules require approval before code. |
| LP-01 | Approved | Learning Profile shows sport-scoped student header including optional derived age, goal, current/next milestone, achieved milestones, 1–5 capabilities, class statistics, last review and History/Gallery links. |
| LP-02 | Approved | Pathway Reference opens read-only static content: supplied Tennis for Life diagram or Glen Eden ski levels. Coach can choose free-text milestones independently of guidance. |
| LP-03 | Approved | Achieved LearningMilestone history and dates retained; edit current/next/goal and add achieved milestone independently of Class Review. |
| LP-04 | Approved | Tennis capabilities: forehand, backhand, serve, volley, agility, eye-hand coordination, stamina. Ski: control, turning, balance, edges, movement, terrain & independence. Unrated allowed. |
| LP-05 | Approved | CapabilityRating stores current rating only, upsert by learningProfileId + capabilityKey with updatedAt. No rating history and no new assessment-notes field; remove misleading assessment-date/editor note controls from functional implementation. |
| INT-STU-01 | Approved | Student-originated Review History/Gallery inherit student and selected sport; offer relevant Class Series/Session filters only and preserve context on Back. Reuse approved CH-10 and CH-12 views and media associations. |
| FUT-STU-01 | Deferred | Export student history, reviews, photos/videos and related information before deletion; not Stage 2 deliverable. |

### Explicit data-model reconciliation / unresolved behavior
- Existing locked workbook `Student.status` is global while latest approved UI status is **per sport**; select and approve a reconciliation strategy before implementing.
- Optional DOB requires physical schema amendment. ClassType storage/derivation must be verified against ClassSeriesStudent membership.
- Define deletion and deactivation outcomes for 1:2–1:4 series, multi-sport identity, tagged and shared media, sessions and historical reviews. Never silently cascade to other students.
- Stage 1 history/baseline may not support full oldest class date or review coverage; show unknown/unavailable rather than invent.
- Capability visual examples are illustrative. Locked current-rating model takes precedence over any drawn optional date or notes field.

## Change log (v0.6)
- **2026-10-24:** Added approved Student Package 1–3 product decisions and outstanding integration/schema safeguards; prior v0.5 decisions retained verbatim except version header.


## I. Final Student Workflow refinements — approved 2026-10-27 / v0.8

These refinements **supersede** earlier open statements about their specific subjects in Section H; all other approved v0.5/v0.6 decisions remain in force.

| ID | Status | Decision |
|---|---|---|
| STU-F01 | Approved | Students page is strictly scoped to the current sport; sample content and shown milestones must never mix Tennis and Ski. STU-01 visual corrected to v2. |
| STU-F02 | Approved | Store active/inactive status per sport on `StudentSport.status`; global `Student.status` future role is an implementation/schema reconciliation matter, not a reason to display cross-sport status. |
| STU-F03 | Approved | Class ratio 1:1–1:4 is derived from ClassSeriesStudent membership, not a separate stored classType field. Include the derived ratio in generated/coached-finalized Class Series display name in Classes & History. |
| STU-F04 | Approved | Group-Class deletion and deactivation must use explicit safeguards; never silently cascade deletion or identity-changing membership into shared class sessions, reviews or media belonging to other students. Exact mutation outcomes and full-student-vs-sport removal remain implementation questions. |
| STU-F05 | Approved | The earlier STU-01 mixed-sport sample image is superseded by `STU-01_Students-Page_Tennis_Approved_v2.png`. |
| STU-F06 | Approved | Unified Student Workflow Functional/UI Specification replaces the separate package documents as the current working specification; all STU/LP screens and Student → History/Gallery reuse rules are retained. |

### Deferred and implementation follow-through
- Student data export (reviews/media/history) before deletion remains deferred.
- Physical migration for StudentSport.status and Student.dateOfBirth remains pending.
- Group-class destructive mutation mechanics and global Student lifecycle reconciliation remain pending.
- CapabilityRating remains latest-value only; LearningMilestone achievement dates remain retained.

## Change log (v0.8)
- 2026-10-27: Added STU-F01–STU-F06, corrected roster visual, finalized derived ratio display and sport status, preserved prior decision history.


## J. User Login — approved 2026-10-27 / v0.9

| ID | Status | Decision |
|---|---|---|
| LOG-01 | Approved | Standard low-key Login page with username or email and password; Show/Hide password. |
| LOG-02 | Approved | **No Coach/Admin selector.** Authenticated account identity determines role; role never trusted from client choice. |
| LOG-03 | Approved | Successful login directs both Coach and Admin to the same existing Home Page. |
| LOG-04 | Approved | Failed authentication stays on Login and displays a non-revealing error. |
| LOG-05 | Approved | Keep me signed in defaults to selected; securely restore valid sessions without storing plaintext passwords. |
| LOG-06 | Approved | Coach can access authorized coaching functions but not user account or backend-data administration. |
| LOG-07 | Approved | Admin can access authorized coaching and administrative functions; backend must enforce role and resource access. |
| LOG-08 | Approved scope boundary | Account initialization, registration, roles administration and data imports are separate Settings/Admin workflows. |
| LOG-09 | Approved UI entry | Forgot password visible; reset mechanics/provider are implementation integration work, not yet designed. |
| LOG-10 | Approved | Explicit logout supported via Settings; expired or revoked session returns to Login. |

### Open technical follow-through — not new product decisions
- Inspect/select authentication provider and identity-to-Coach/role mapping.
- Finalize provider session duration, reauthentication, password reset, throttling and account lifecycle integration.
- Source workflow included sample plaintext credentials. Never reuse them in docs/repository; rotate any credentials actually in use.

## Change log (v0.9)
- 2026-10-27: Approved LOG-01–LOG-10; registered login design completion and provider/schema implementation dependencies. All earlier decisions retained.


## Admin Account & Data Initialization — confirmed 2026-10-27 (v1.1)
| ID | Status | Decision |
|---|---|---|
| ADM-01 | Approved | Clerk handles authentication, invitation, passwords and sessions; Convex enforces EchoCoach roles and coaching-data authorization. |
| ADM-02 | Approved | Multiple Coach accounts supported; each Coach accesses only authorized coaching data, while Admin has platform-wide management access. |
| ADM-03 | Approved | Exactly one Coach-role account links to one Coach record. Admin account need not have Coach record unless it also coaches. |
| ADM-04 | Approved | Account invitation requires name, email, role; user establishes own password. |
| ADM-05 | Approved | Admin Coach ↔ Admin role changes require confirmation and access checks; protect the last active Admin. |
| ADM-06 | Approved | Stage 2 supports account deactivate/reactivate only, with no permanent account deletion UI. Retain coaching history. |
| ADM-07 | Approved | Initial Admin established by secure one-time developer bootstrap; subsequent accounts invited by Admin. |
| ADM-08 | Approved | Student and Class Initialization are Admin-only Stage 2, with future coach self-service deferred. |
| ADM-09 | Approved | Initialize Student + StudentSport + baseline, then Class Series; import historical Class Series, but do not fabricate missing historical Sessions, Reviews or Media. |
| ADM-10 | Approved | Excel/CSV bulk upload and controlled Stage 1 Convex migration; both use preview, field mapping, validation, confirmation and result summary. |
| ADM-11 | Approved | One shared Student identity; explicit CoachStudent authorizations permit multiple Coaches to associate with the same Student. |
| ADM-12 | Approved | If two authorized coaches teach the same student in the same sport, both may view and edit the same StudentSport Learning Profile (goals, milestones, current capabilities). |
| ADM-13 | Approved | CoachStudent authorization does not imply blanket access to another Coach's individual Class Reviews or media. Enforce record-level authorization. |
| ADM-14 | Approved | Shared-profile simultaneous edit handling, field-level provenance and richer audit/history are deferred improvement opportunities; baseline safeguard should prevent silent accidental overwrites where feasible. |
| ADM-15 | Approved | Initialization must prevent silent duplicate creation, preserve authoritative Stage 1 `sequenceBaseline`, show dry-run changes and store audit outcomes. |

### Admin implementation decisions still open
- Precise Clerk-to-Convex synchronization and invitation lifecycle.
- CoachStudent scope, grant/revoke process and authorization checks by sport, class and resource.
- Shared-profile optimistic-concurrency/version or last-write conflict policy; detailed advanced history deferred.
- Import batch mechanics, row-matching keys, transactional/resumable behavior, and source adapters.


## Settings — approved 2026-10-27 (retained from v1.0)
- Settings accessed via Home icon.
- Coach and Admin: My Profile, App Preferences (English/中文 and default Sport), App Info placeholder, Log Out.
- Admin only: Account Management, Student Initialization and Class Initialization.
- Stage 2 Student and Class initialization remain Admin-only; Coach self-service is deferred.
- Display name/password changes allowed; email read-only in Stage 2; log out terminates session.
- Backend checks enforce privileges independently of Settings UI visibility.
