# EchoCoach Stage 2 — Product Decisions Log

**Version:** 0.3 (post-save attendance and navigation decisions)  
**Updated:** 2026-10-16  
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
