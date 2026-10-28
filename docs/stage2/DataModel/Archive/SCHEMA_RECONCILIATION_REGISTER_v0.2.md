# EchoCoach Stage 2 — Physical Schema Reconciliation Register v0.2
Date: 2026-10-28  
Scope: Steps 1–2 — consolidate design-domain structure and propose constraints/indexes. No Convex code inspection or migration.

## Relationship to workbook
**Source:** `EchoCoach_Stage2_Level3_Admin_Review_v1.4.xlsx` (13 original worksheets).  
**Target:** `EchoCoach_Stage2_Level3_Reconciled_Target_v1.5.xlsx` (original sheets preserved, plus TARGET Field Dictionary, TARGET Constraints Indexes, CHANGE MAP v1.5).  
**Change record:** This register explains reconciliation changes, open technical choices and their product-decision lineage; the workbook `CHANGE MAP v1.5` is the row-wise actionable companion.  
**Difference from register v0.1:** v0.1 was a preliminary issue list, not an exhaustive v1.4-to-v1.5 comparison. This v0.2 register is aligned to the new workbook's 16-item change map but is still **not** an automated cell-level diff or a deployed schema migration.

## Consolidated outcomes
| Change IDs | Domain | Resolution | Status |
|---|---|---|---|
| REC-01 | CoachStudent | Target sport-scoped Coach + Student + Sport grant, not blanket Coach + Student authorization | Approved business rule; target physical design |
| REC-02 | Cross-coach sequence | Student + Sport cumulative numbering across coaches; stable actual-date ordering | Approved rule; precise same-day tie-break pending |
| REC-03 | Session dates | `plannedDate` optional; `sessionDate` actual date; `scheduledDate` superseded | Approved; code verification pending |
| REC-04–05 | Student fields | Optional `dateOfBirth`; required `StudentSport.status`; legacy global `Student.status` retained for migration review | Approved; code verification pending |
| REC-06 | Class ratio | Derive from immutable membership count (1:1–1:4), not a separate stored classType | Approved |
| REC-07 | Planning | Separate session creation and ClassPlan upsert; optional `studentNotes` | Approved |
| REC-08 | Identity/roles | `UserAccount` linked to Clerk; role and status in Convex; at most one Coach account per Coach record | Approved policy; physical lifecycle proposed |
| REC-09 | Import audit | `ImportBatch`, `ImportRowResult`, proposed `ImportSourceMap` | Logical target proposal; fields/indexes require technical confirmation |
| REC-10 | Shared Learning Profile | One StudentSport profile, shared edits for authorized coaches of same sport | Approved; concurrency controls minimal initially |
| REC-11 | Review/media privacy | Review and media access must be checked at record/resource level | Approved boundary; exact ownership implementation pending |
| REC-12–13 | Deactivation/deletion | Close affected active Class Series without rewriting membership; block unsafe Student deletion | Approved; backend transactions pending |
| REC-14 | Legacy sheet cleanup | Canonical target dictionary created while preserving legacy and amendment sheets | Completed in workbook |
| REC-15 | Stage 1 cutover | Preserve authoritative Tennis baseline and original reviews; no synthetic sessions | Approved |
| REC-16 | Recurrence | Keep basic schedule fields; advanced multiple intervals remain backlog | Deferred |

## Target model content
- `TARGET Field Dictionary`: 101 field/rule rows. Includes virtual `ClassSeries.classType` explicitly marked **not stored** and `ClassSeries.studentSetKey` proposed as a materialized canonical membership key for enforceable uniqueness.
- `TARGET Constraints Indexes`: 25 logical invariants and query/index requirements. These are **proposed Convex index shapes**, not verified schema.ts declarations; Convex uniqueness must be enforced in mutations, not presumed automatic from indexes.
- `CHANGE MAP v1.5`: 16 reconciliation items, each linked to a decision source, priority, and state.

## Open engineering choices (do not treat as approved physical implementation)
1. **Same-day ordering:** define a stable tie-breaker across different Class Series (e.g., a confirmed class-start timestamp with deterministic fallback); do not use review creation timestamp alone. Recalculation after corrections must be tested.
2. **ClassSeries canonical set key:** normalization, race-safe creation, inactive-series reuse policy, and migration collision handling.
3. **CoachStudent grant lifecycle:** who grants/revokes, expiry/inactive status, handling when a shared StudentSport remains active for another coach.
4. **Review/media privacy:** precise owner/visibility attributes and query/mutation checks; a CoachStudent grant cannot expose another Coach's private records automatically.
5. **UserAccount invitation state:** invited identity may precede `clerkUserId`; define separate pending invitation record or optional identity/linking strategy before implementing Clerk sync.
6. **Import data design:** batch fingerprints, row outcome transitions, SourceMap idempotency, transaction boundaries and retries.
7. **Global Student status:** migration handling, scope of the legacy field and how global student deletion differs from per-sport deactivation.
8. **Shared profile concurrency:** minimal stale-write prevention suitable for Stage 2 versus richer audit in future backlog.
9. **Session date/status lifecycle:** completed vs cancelled vs planned state transitions and denormalized date update logic.

## What is complete / not complete
**Completed:** logical domain consolidation; target fields/constraints/index candidates; traceable changes from the v1.4 design workbook to the v1.5 target.  
**Not yet complete:** inspection of live `convex/schema.ts`, backend functions and deployed database; feasibility/compatibility audit; migration scripts, data verification and rollout; formal technical sign-off.

## Recommended next action
Use Cursor in read-only inspection mode to enumerate existing Convex tables/indexes, queries and mutations, then prepare an **as-is → target implementation delta**. Keep production deployments untouched until backup/migration/test acceptance gates pass.
