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

---
## Step 3 code audit and Step 4 decision addendum (2026-10-28)
**Target:** `EchoCoach_Stage2_Level3_Reconciled_Target_v1.6.xlsx`; workbook v1.5 is baseline; 16 original sheets preserved. **Evidence:** Codex read-only audit against `convex/schema.ts`, related queries/mutations and v1.5 workbook. No production data inspected, no code changed. New sheets: `STEP4 Approved Decisions`, `STEP4 Engineering Open`, `STEP3 Code Audit Delta`.

### Approved technical decisions — binding target requirements
| ID | Decision | Impact |
|---|---|---|
| PSR-01 | Same-day classes order by actual `sessionDate`, actual start time if known, then a stable session identifier; deterministic fallback when time unknown. | Add/confirm optional actual start-time representation; do not assume planned time is actual; test replay ordering. |
| PSR-02 | Attendance corrections renumber all later qualifying attended sessions for the Student + Sport across coaches. | Atomic correction + sequence recompute; preserve original Stage 1 baseline; absent has no number. |
| PSR-03 | ClassReview/MediaAsset visibility belongs to the owning ClassSeries Coach and authorized Admin. Shared StudentSport profile access alone is insufficient. | Resource-path ACL checks on queries and mutations; media resolves through Participation → Session → Series. |
| PSR-04 | Keep legacy Stage 1 `classes` and `reviews` during Stage 2 migration. | Compatibility adapters; preserve existing string IDs, baseline and review continuity; retirement requires separately verified cutover. |

### Observed code gaps (Codex)
- **P0 missing security:** no Clerk integration, `UserAccount`/Admin roles, `CoachStudent` sport ACL or `ctx.auth` access checks in inspected functions. Secure Stage 1 legacy endpoints before multi-coach launch.
- **P0 true structural:** `StudentSport.status`, `ClassSession.plannedDate`, target account/import tables missing; ClassSeries student-set identity key absent; Student DOB and ClassPlan.studentNotes missing.
- **P0 implementation not missing schema:** ClassSession, ClassPlan, ClassReview, SessionParticipation and MediaAsset tables exist; lifecycle mutations, attendance correction, sequencing and resource authorization are not built.
- **P0 migration:** Stage 1 `classes`/`reviews` active; old review `studentId` may be string; Tennis cutover depends on authoritative baseline; no fabricated sessions.
- **P1 import:** `ImportBatch`, `ImportRowResult`, `ImportSourceMap` are missing.

### Remaining engineering choices — recommendations, NOT approved decisions
1. **ENG-01:** date-only same-day sessions: define precise stable ID encoding (and handling of unknown start times). Recommended: actual date, known actual start minute (not planned date/time), then immutable session ID; document null-time sort position.
2. **ENG-02:** invite states and `clerkUserId` binding: recommend separate pending invitation record or nullable identity with verified link, plus idempotent re-invites; Clerk API feasibility to confirm.
3. **ENG-03:** import namespace and source identities: recommend composite source namespace/entity/external ID, batch fingerprint and retry-safe row key; ambiguous name matches require manual review.
4. **ENG-04:** canonical `studentSetKey`, conflict/race control, inactive series reuse: review with existing classSeries mutation semantics.
5. **ENG-05:** authorized CoachStudent grant/revoke lifecycle and bootstrap privileges.
6. **ENG-06:** explicit Stage 1 contract, backup/rollback and dev migration validation.
7. **ENG-07:** minimum stale-write detection for shared learning profile; deeper attribution/history backlog.
8. **ENG-08:** legacy public API authorization and destructive review deletion guard.

### Implementation readiness and gates
- **Completed:** target comparison with inspected source, approved four Step 4 rules, consolidated target workbook v1.6 and code-gap categorization.
- **Not yet complete:** final engineering sign-off on open mechanics, any modifications to Convex code, development/production migrations, source-of-truth deployed data audit, full schema compatibility tests.
- **Next:** review ENG-01 to ENG-08 in technical planning; prepare versioned migration and code change plan; no direct replacement of live schema.
