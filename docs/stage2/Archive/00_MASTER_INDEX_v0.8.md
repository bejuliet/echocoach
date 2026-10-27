# EchoCoach Stage 2 — Master Specification Index

**Version:** 0.8 (Classes & History documentation release; path correction 2026-10-23)  
**Updated:** 2026-10-23  
**Target folder:** `~/Projects/EchoCoach-Stage2/docs/stage2/`

## Purpose
This index tracks Stage 2 design documents, decisions, dependencies, approvals and implementation status. **A design decision is not evidence of implementation.**

## Status definitions
- **Draft:** Under discussion, not authorized for implementation.
- **Decisions agreed:** Direction selected, final document approval pending.
- **Approved:** Specific document version approved for implementation.
- **Implemented:** Verified in code and tests.
- **Deferred:** Future scope.

## Specification register

| ID | Area | Design status | Implementation status |
|---|---|---|---|
| ST2-01 | Homepage, sport selection, navigation | **Approved**; bottom navigation Home / Classes / Students | Not verified |
| ST2-02 | Authentication and coach account | To design | Not verified |
| ST2-03 | Students and profiles | To design | Not verified |
| ST2-04 | Classes & History: series, sessions, recurring schedules, archives, gallery | **Approved design**; Classes & History Functional/UI v1.0, Implementation v1.0, Visual v1.3 | Not verified |
| ST2-05 | New Class Plan | **Approved v1.1 integration revision**; original v1.0 UX retained; profile AI detail deferred | Not verified |
| ST2-06 | New Class Review | **Approved v1.2 integration revision**; v1.1 group attendance retained | Stage 2 not verified |
| ST2-07 | Media | Gallery browsing and session-scoped upload entry points approved; full Media workflow deferred | Not verified |
| ST2-08 | Cross-workflow integration review | Documentation-level validation completed 2026-10-23; code/schema verification outstanding | Not verified |
| FUT-01 | Booking and class-centric homepage | Deferred | Not verified |
| FUT-02 | Student-facing WeChat | Deferred | Not verified |

## Document locations — current repository layout (confirmed by product owner, 2026-10-23)

All paths below are relative to `~/Projects/EchoCoach-Stage2/docs/stage2/`. Folder names and filename suffixes are shown exactly as organized in Finder. This is a **local file inventory**, not verification of Git tracking or GitHub push.

| Area | Relative path | Notes |
|---|---|---|
| Master Index | `00_MASTER_INDEX_v0.5.md` | Current approved index; v0.3/v0.4 retained |
| Product Decisions | `01_PRODUCT_DECISIONS_v0.5.md` | Current approved decisions; v0.3/v0.4 retained |
| Classes & History functional/UI | `Class History/01_Classes_History_Functional_UI_v1.0_REVIEW.docx` | Approved content; `_REVIEW` retained in actual filename |
| Classes & History implementation | `Class History/02_Classes_History_Implementation_v1.0_REVIEW.md` | Approved content |
| Classes & History visual | `Class History/EchoCoach_Classes_History_Visual_Concept_v1.3_REVIEW.docx` | Approved v1.3 visual; actual source screenshots |
| Classes & History review guide | `Class History/00_REVIEW_GUIDE.md` | Historical review guide |
| Level 3 data model | `DataModel/EchoCoach_Level3_Data_Model_Stage2_ClassesHistory_v0.5.xlsx` | Current coordinated model; older workbooks retained |
| New Class Plan functional/UI | `NewClassPlan/04_NewClassPlan_Functional_UI_v1.1_REVIEW.docx` | Approved integration revision; original v1.0 retained |
| New Class Plan implementation | `NewClassPlan/05_NewClassPlan_Implementation_v1.1_REVIEW.md` | Approved integration revision |
| New Class Review functional/UI | `NewClassReview/06_NewClassReview_Functional_UI_v1.2_REVIEW.docx` | Approved integration revision; original v1.1 retained |
| New Class Review implementation | `NewClassReview/07_NewClassReview_Implementation_v1.2_REVIEW.md` | Approved integration revision |
| Release manifest | `Release/RELEASE_MANIFEST.md` | Release inventory |
| Validation/signoff | `Release/VALIDATION_AND_RELEASE_SIGNOFF_v0.5.md` | Documentation checks and limitations |
| Homepage | `HomePage/` | Prior approved Homepage documentation retained; exact filenames not reverified in current screenshots |

**Historical copies:** The `NewClassPlan/`, `NewClassReview/`, and `DataModel/` folders retain earlier versions for traceability. A file ending `_REVIEW` may nevertheless have approved content; approval is recorded in this index and the release signoff rather than inferred from the filename.

**Idea Backlog:** Planned addition at `Idea Backlog/` under `docs/stage2/`, after the product owner downloads it from ChatGPT Library. Its presence in the local repository has not yet been confirmed. Recurrence every 1–4 weeks has been promoted to Stage 2 approved scope, so the backlog should be marked accordingly.

**Future specifications:** Authentication, Students & Profiles, and detailed Media workflow are not yet approved. Do not treat placeholders as existing files.

## Dependencies
Coach authentication and identity → active sport context → homepage and navigation → students and classes → class plans and reviews → media. These are conceptual dependencies, not necessarily a strict coding order.

## Repeatable workflow
1. Product owner drafts scenarios, sketches and constraints.
2. Review missing rules, alternatives, dependencies and edge cases.
3. Record agreed decisions and deferrals in the decisions log.
4. Create functional/UI specification, developer Markdown and visual where applicable.
5. Obtain explicit approval of the specific specification version.
6. Inspect existing Next.js/Convex code and schema before modifying anything.
7. Implement incrementally with tests; record implementation status.

## Workspace notes
- `~/Projects/EchoCoach/` — `main` branch.
- `~/Projects/EchoCoach-Stage2/` — `stage2` branch; **documentation target**.
- `~/Projects/EchoCoach-Stage2-Integration/` — `stage2-integration` branch; preserve integration setup.
- All three local workspaces were observed connected to the same GitHub remote. Do not merge branches or change database environments as part of documentation work.

## Maintenance
GitHub holds committed version-controlled specifications. ChatGPT Project reference files do not automatically synchronize. Mark unspecified behavior **TBD**; do not let Codex/Cursor silently decide unresolved product behavior.

## Design sequence update (2026-10-15)
Design: Homepage → New Class Review → New Class Plan → Classes/History → Students/Profiles → Authentication/Coach Account → Media → Cross-workflow integration. Implementation order is separately determined by code/schema inspection.

## Release gate
Historical gate (superseded by v0.5 documentation approval): Class Review v1.1 documents were drafts at that time, not authorization to implement. Validate remaining AI/recording Stage 1 behavior, transaction boundaries, group attendance completion, and legacy cutover before approval.

## Class Review v1.1 workflow register (2026-10-16)
- Four numbered steps remain **Class Context → What Did We Do in Class? → Progress in Class → Next Steps & Review (AI generation, edit, approval, Save)**.
- **Review Other Students from This Session** is shown **only after a successful first review save** for group sessions; it is a post-save continuation, not Step 3 or a numbered Step 5. For 1:1 sessions, show save success and Finish.
- Post-save roster shows all enrolled students' attendance and review status independently; actions include **Start Review**, **Absent**, secondary **Mark Attended without Review**, and View/Edit or Change for resolved rows.
- Subsequent student reviews begin at Step 3 with editable pre-filled Step 2 shared activities; student-specific progress and next steps are reset.
- Coach may exit with `unknown` attendance after acknowledging a clear unresolved-count warning; do not infer absent or complete the session.
- No new attendance fields required; retain Level 3 `SessionParticipation.attendanceStatus` (`unknown | attended | absent`), conditional `studentSequenceNumber`, and existing completion/correction rules.
- **Historical status (2026-10-16):** design decisions agreed; v1.1 drafts then required approval. Superseded by approved v1.2 integration documentation in v0.5. Visual is illustrative and does not override model fields.
- **Historical Library location:** `/EchoCoach Stage2/Working Files/`. The current local repository inventory is documented above; GitHub sync remains unverified.

## Change log
- **2026-10-23 / v0.5 path correction:** Updated canonical references to the product owner’s actual `docs/stage2/` folder organization; no product rules changed.
- **2026-10-16 / v0.3:** Registered Class Review v1.1, post-save group attendance, skip for 1:1, leave-with-unknown warning, and data-model safeguards; updated spec references from v1 to v1.1.

## New Class Plan v1.0 — approved (2026-10-16)
- **Homepage**: preserve approved homepage; exactly three bottom navigation choices: **Home, Classes, Students**. No homepage redesign.
- **Main visual journey**: four screens/phases only: **Homepage → Class Context → Create Class Plan → Review & Save**. **Existing Plan View/Edit** is a separate return-user scenario, NOT step five.
- **Class Context**: active sport inherited; select Class Series → Class Session (no Student selector); roster lists enrolled students with View Profile. Existing sessions newest sequence first and not preselected. New session persisted immediately with server-assigned sequence, optional `plannedDate`; may exist without a plan.
- **Editor**: Q1 Class Goal, Q2 Class Agenda, Q3 optional unstructured Student-Specific Notes; all three on one scrollable screen with text and voice input together. Q1 and Q2 are also optional at storage/save level; no required-field gate.
- **AI**: initial suggestions generated automatically from available context, populate only untouched fields; automatic language polish on Review & Save; coach edits and explicitly saves. Never overwrite edits or invent student facts. AI failure permits manual save. Detailed profile context selection deferred until Students & Profiles and test data.
- **Save**: one plan per session; simple Save (no draft/final status); revisit View/Edit updates same plan; never silently change saved Class Reviews.
- **Data model**: Level 3 existing `classGoal` and `classDrills` are optional; optional `studentNotes` is a **Stage 2 approved product addition, pending physical schema/code validation**. Separate session-create from plan upsert while retaining transactional integrity for each operation.
- **Files**: `NewClassPlan/EchoCoach_Stage2_NewClassPlan_Functional_UI_v1.0.docx`, `NewClassPlan/EchoCoach_Stage2_NewClassPlan_Implementation_v1.0.md`, `NewClassPlan/EchoCoach_Stage2_NewClassPlan_Visual_v1.0.png`; `DataModel/EchoCoach_Level3_Core_Model_WITH_LEARNING_PROFILE_Stage2_ClassPlan_v1.0.xlsx`.
- **Next design**: Classes & History, then Students & Profiles. No Stage 2 implementation authorized yet.

## Change log (continuation)
- **2026-10-16 / v0.4:** Approved New Class Plan v1.0, confirmed homepage 3-tab navigation and four-screen visual, documented AI deferral, simple Save and data-model amendment.


## Classes & History coordinated documentation release — 2026-10-23 / v0.5
**Product owner approval:** Classes & History functional/UI and implementation v1.0; New Class Plan functional/UI and implementation v1.1; New Class Review functional/UI and implementation v1.2; Visual Concept v1.3 (original screenshots with commentary). These approvals cover design documentation only, not code, schema migrations, or deployment.

### Canonical artifacts in this release
Use the **Document locations — current repository layout** table above for the authoritative relative paths. In particular, the folder is `Class History/` (with a space), approved files still have `_REVIEW` in their actual names, and release records are under `Release/`.

Approval applies to the versions recorded in that table; it does not imply that local files have been committed or pushed.

### Approved cross-workflow rules
- Series identity coach + sport + exact student set; membership locked. Manage Class has **Class Series** and **Sessions** tabs; no extra landing-page action.
- Coach greeting + active series/student summary precedes series cards; each card includes location and four actions (Manage Class, Review History, Class Plans, Gallery).
- Each series has optional independent recurring slots with day, start, end, frequency 1–4 weeks and anchor; schedule only suggests future dates, never auto-creates sessions.
- Session creation is independent from plan/review. Session sequence assigned by creation order, never reordered by date edits. Deletion of an empty session requires confirmation and atomic renumbering of higher sequence values, preserving internal IDs.
- Universal Review History uses individual student review cards, series/student/session filters and two-at-a-time loading. Universal Plan Archive uses series/session filters only, including upcoming and completed plans. Gallery supports session-scoped media, zero-or-more student tags, type filter and upload from Gallery, Session and Review contexts.
- Detailed media lifecycle, authentication, Students & Profiles, physical schema reconciliation and migration remain outside this documentation release.

### Superseded references
Earlier v0.4 statements that Classes & History is 'to design', or that Plan v1.0 and Review v1.1 are latest, are historical and superseded by this section. Prior original documents remain preserved for traceability.


## Student Workflow consolidation — 2026-10-27 (v0.8)

The canonical Student Workflow design is now **EchoCoach_Stage2_Student_Workflow_Functional_UI_v1.0.docx**; it replaces the separately distributed Student Package 1, 2 and 3 documents for working-reference purposes (older approvals remain in historical archives). Functional/UI approval does not imply schema migration or code deployment.

| Record | Current file | Status |
|---|---|---|
| Unified Student Functional/UI | `EchoCoach_Stage2_Student_Workflow_Functional_UI_v1.0.docx` | Approved design |
| Updated Level 3 workbook | `EchoCoach_Stage2_Level3_Data_Model_Student_Review_v1.2.xlsx` | Review/implementation reconciliation |
| Student model and implementation safeguards | `EchoCoach_Stage2_Student_Implementation_Notes_v1.0.md` | Open technical follow-through |
| Product decision log | `01_PRODUCT_DECISIONS_v0.8.md` | Consolidated approved decisions and open behavior |
| Full-resolution approved visuals | `Visuals/STU-01...` and associated STU/LP images | Approved illustrative design |

The roster has a sport-only display rule; the Class Series ratio is derived and included in the generated/coach-finalized display name; StudentSport.status is the chosen sport-specific status model; and group-class deletion/deactivation require explicit safeguards.
