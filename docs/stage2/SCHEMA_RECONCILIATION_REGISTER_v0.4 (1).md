# EchoCoach Stage 2 — Physical Schema Reconciliation Register v0.4
Date: 2026-10-28  
Status: Engineering decisions approved; documentation-only target. No Convex code or database changes.

## Sources and authority
- Target: `EchoCoach_Stage2_Level3_Reconciled_Target_v1.7.xlsx` (21 worksheets). **New authoritative addenda:** `ENG Approved v1.7`, `TARGET Refinements v1.7`.
- Baseline: v1.6 (19 sheets), retaining v1.5 logical target and original v1.4 amendment/source sheets.
- Product Decisions v1.3 and subsequent approved PSR-01–04 and ENG-01–08 decisions.
- Codex read-only audit against `convex/schema.ts` and relevant application modules; no deployed Convex data inspected.

**Reading rule:** v1.7 addenda supersede older cells or open-issue labels where they conflict. Earlier sheets are retained for history and traceability, not as independent competing sources of truth. A full replacement canonical field dictionary still requires incorporating the addenda into the core target rows during code-level implementation specification.

## Newly approved engineering decisions
| ID | Approved resolution | Target impact | Implementation checks |
|---|---|---|---|
| ENG-01 | Same-day sort: actual session date → known actual start time → stable immutable session identifier; unknown start time after known times | Optional actual start minute; deterministic sequence comparator | Tests for missing times, backdated corrections, cross-coach sessions; not planned time/review timestamp |
| ENG-02 | Pending Clerk invitations separate from activated UserAccount; bind account after verified acceptance | Add proposed AccountInvitation entity and unique verified `clerkUserId` mapping | Confirm Clerk invitation/webhook mechanics; idempotent invite/revoke/accept; prevent duplicate Coach |
| ENG-03 | Source namespace + entity type + stable external ID; retry-safe batch/row keys; no name-only auto-merge | ImportSourceMap and batch fingerprints | Ambiguous matches require review; repeated import idempotent |
| ENG-04 | Reactivate inactive series when Coach+Sport+exact roster match; preserve history and continue sequence | Immutable canonical studentSetKey and identity lookup; safe reactivation | Detect preexisting collisions; verify sport enrollment/grants; no new duplicate series |
| ENG-05 | Admin initially grants/revokes Coach+Student+Sport access without destroying history or another coach's grant | CoachStudent status/timestamps, sport-scoped ACL | No access to other sports; history and private series records remain protected |
| ENG-06 | Backup and validate development data first; retain legacy tables, compatibility and tested rollback | Migration safety gates, preserve Stage 1 IDs and baseline | Explicit environment controls; separate authorization for production migration |
| ENG-07 | Minimal optimistic concurrency / stale-write detection for shared Learning Profile | Revision or expected-version guard on profile edits | Reject stale concurrent writes; advanced history remains backlog |
| ENG-08 | Secure legacy public APIs, including destructive review functions, before multi-coach rollout | Auth/authorization around old queries/mutations | Stage 1 compatibility regression tests; no unauthorized deletion |

## Prior binding rules retained
- PSR-01 to PSR-04: stable same-day ordering; renumber later attended Student+Sport sequences on corrections; Review/Media resource access limited to owning ClassSeries Coach and Admin; retain legacy `classes`/`reviews` until verified cutover.
- Shared `StudentSport` Learning Profile writable by authorized coaches in same sport; private ClassReview/Media never shared solely through a student-sport grant.
- ClassSeries identity = Coach + Sport + **exact student set**. Time slot changes do not alter identity. Group membership changes create a distinct series.
- Stage 1 historical baselines authoritative; no fabricated sessions, reviews, or attendance.
- Sport-specific deactivation and dependency-safe student deletion; historical records preserved.

## Actual code → target gap register (from Codex audit; no code modifications)
| Priority | Area | Observed as-is | v1.7 target | Type / next action |
|---|---|---|---|---|
| P0 | UserAccount, Clerk, Admin | No auth modules/role checks | Authenticated unique user-to-Coach, Admin controls, pending invitation separately | New tables + middleware; provider mechanics confirm |
| P0 | CoachStudent sport grant | No grant table or resource authorization | Unique coach/student/sport active grant, Admin-managed | New table + authorization |
| P0 | Legacy exposed functions | No observed ctx.auth protections | Secure all public legacy endpoints, preserve Stage 1 | Backend security + compatibility |
| P0 | StudentSport.status | Not present | Active/inactive per sport | Schema field + lifecycle |
| P0 | ClassSeries identity | Procedural check, roster mutable before sessions | Canonical roster key; uniqueness/race-safe reactivation | Schema/index + mutations, migration collisions |
| P0 | ClassSession dates/time | sessionDate optional; plannedDate absent | Separate plannedDate and sessionDate, optional actualStartMinute | Fields + validations |
| P0 | Class Plan/Review/Participation | Tables exist, mutations largely absent | Implement full plan/review/attendance lifecycle | Backend implementation |
| P0 | Sequence numbering | Fields exist, allocation/recalc absent | Student+Sport across coaches; deterministic same-day; corrections renumber | Backend mutations + transaction testing |
| P0 | Review/Media ACL | Resource linking exists, no guards | Owning ClassSeries Coach or Admin | Query/mutation guards |
| P0 | Stage 1 cutover | Baseline and legacy code present | Preserve data and APIs; safe migration gates | Migration compatibility |
| P1 | Student DOB and ClassPlan notes | Absent | Optional dateOfBirth and studentNotes | Fields |
| P1 | Import idempotency | No import entities | Batch, row outcome, source map with stable IDs | New tables + workflow |
| P1 | Shared profile concurrency | Shared structure, no stale-write guard | Basic expected-revision write | Mutation safeguards |
| P1 | Student deletion, group transition | Existing logic insufficient | Block unsafe delete; close old series and create new identity as needed | Lifecycle + tests |

## Engineering implementation details to verify, not new product decisions
1. Clerk API invitations and verified acceptance hooks; do not assume immediate durable identity on invitation dispatch.
2. Actual start-time field units and timezone: local class minute-of-day with explicit date/location context; deterministic immutable ID comparison.
3. Canonical student-set normalization and handling of preexisting duplicate series.
4. Convex query/index shape and transaction semantics; indexes do not automatically impose uniqueness.
5. Import source-key normalization/hash and batch atomicity within Convex limits.
6. Profile concurrency implementation (integer revision vs expected timestamp) and error UX.
7. Scoped production-deployment inspection and migration sequencing only after explicit separate authorization.

## Completion criteria
**Documentation updated:** v1.7 workbook, this v0.4 register, implementation plan v1.0.  
**Not executed:** Convex schema updates, auth integration, migrations, deployments, production data reads, code modifications.  
**Next:** Technical implementation preparation with Cursor, starting development safety and Stage 1 baseline/regression inventory before code changes.
