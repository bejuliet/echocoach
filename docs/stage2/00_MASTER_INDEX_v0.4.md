# EchoCoach Stage 2 — Master Specification Index

**Version:** 0.3 (Class Review v1.1 design update registered)  
**Updated:** 2026-10-16  
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
| ST2-04 | Classes / class series / class sessions (including standalone session logging) | To design; standalone logging approved | Not verified |
| ST2-05 | New Class Plan | **Approved UX v1.0**; detailed AI recommendation logic deferred to Students & Profiles | Not started |
| ST2-06 | New Class Review | **Approved v1.1**; group attendance post-save | Stage 2 not verified |
| ST2-07 | Media | To design | Not verified |
| ST2-08 | Cross-workflow integration review | Planned | Not verified |
| FUT-01 | Booking and class-centric homepage | Deferred | Not verified |
| FUT-02 | Student-facing WeChat | Deferred | Not verified |

## Document locations (current and planned)
- `01_PRODUCT_DECISIONS.md` — decisions and open questions.
- `ClassReview/EchoCoach_Stage2_ClassReview_Functional_UI_v1.1_DRAFT.docx` — draft review UX/functional specification.
- `ClassReview/EchoCoach_Stage2_ClassReview_Implementation_v1.1_DRAFT.md` — draft technical contract.
- `ClassReview/EchoCoach_Stage2_ClassReview_Visual_v1.1.png` — illustrative visual, not a production UI.
- `DataModel/EchoCoach_Level3_Core_Model_WITH_LEARNING_PROFILE_Stage2_Updated.xlsx` — workbook with approved date/logging additions; inspect before schema change.
- `specifications/homepage.md` — approved homepage implementation spec (to copy into repository).
- `specifications/authentication.md`, `students.md`, `classes.md`, `class-plan.md`, `class-review.md`, `media.md` — future specifications.
- `data-model/` — canonical Stage 2 data model and lifecycle/integrity specifications (to add).
- `ui-designs/` — UI reference visuals (illustrative, not source code).
- `IMPLEMENTATION_STATUS.md` — future implementation and test ledger.

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
Class Review v1.1 documents are **drafts**, not authorization to implement. Validate remaining AI/recording Stage 1 behavior, transaction boundaries, group attendance completion, and legacy cutover before approval.

## Class Review v1.1 workflow register (2026-10-16)
- Four numbered steps remain **Class Context → What Did We Do in Class? → Progress in Class → Next Steps & Review (AI generation, edit, approval, Save)**.
- **Review Other Students from This Session** is shown **only after a successful first review save** for group sessions; it is a post-save continuation, not Step 3 or a numbered Step 5. For 1:1 sessions, show save success and Finish.
- Post-save roster shows all enrolled students' attendance and review status independently; actions include **Start Review**, **Absent**, secondary **Mark Attended without Review**, and View/Edit or Change for resolved rows.
- Subsequent student reviews begin at Step 3 with editable pre-filled Step 2 shared activities; student-specific progress and next steps are reset.
- Coach may exit with `unknown` attendance after acknowledging a clear unresolved-count warning; do not infer absent or complete the session.
- No new attendance fields required; retain Level 3 `SessionParticipation.attendanceStatus` (`unknown | attended | absent`), conditional `studentSequenceNumber`, and existing completion/correction rules.
- **Status:** design decisions agreed; v1.1 specification drafts require explicit approval before implementation. Visual is illustrative and does not override model fields.
- **Library file location:** `/EchoCoach Stage2/Working Files/`. Repository paths above are intended destinations, not proof of GitHub sync.

## Change log
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
