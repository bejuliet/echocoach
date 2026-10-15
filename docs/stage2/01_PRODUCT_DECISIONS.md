# EchoCoach Stage 2 — Product Decisions Log

**Version:** 0.1 (working baseline)  
**Updated:** 2026-10-15  
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

## C. New Class Review — draft, not yet approved
| ID | Status | Detail |
|---|---|---|
| CR-01 | Draft | Preserve existing four-step review generation process where feasible. |
| CR-02 | Draft | Progressive Class Series → Student → Class Session selectors. |
| CR-03 | Draft | Create New actions return with refreshed options. |
| CR-O1 | Open | Existing vs. new session and numbering behavior. |
| CR-O2 | Open | Session date confirmation placement and validation. |
| CR-O3 | Open | Duplicate reviews, drafts, group-class continuation. |
| CR-O4 | Open | Save transaction, attendance updates and error recovery. |

## D. Design and implementation process
| ID | Status | Decision |
|---|---|---|
| PROC-01 | Agreed | Owner sketches → feedback/options → decisions → functional/UI and implementation specs + visuals. |
| PROC-02 | Agreed | Finish interconnected core specs before full UI implementation; read-only technical inspections/limited proofs allowed. |
| PROC-03 | Agreed | Cross-workflow review and schema reconciliation before incremental tested implementation. |
| PROC-04 | Agreed | Repository docs in `EchoCoach-Stage2/docs/stage2/`, ChatGPT Project reference copies. |
| PROC-05 | Agreed | Preserve separate integration workspace; no incidental merges/migrations/deployments. |

## E. Planned next specifications
Authentication and Coach Account → Students and Profiles → Classes → New Class Plan → New Class Review → Media → Cross-workflow review.

## Change log
- **2026-10-15 / v0.1:** Initial consolidated log, distinguishing agreed decisions from open implementation details and draft workflows.
