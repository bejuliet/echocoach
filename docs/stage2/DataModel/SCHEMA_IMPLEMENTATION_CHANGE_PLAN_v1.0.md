# EchoCoach Stage 2 — Schema Implementation Change Plan v1.0
Date: 2026-10-28  
Status: Approved engineering policies incorporated. **Plan only, not authorization to modify code or data.**

## Authority
- Physical target workbook `EchoCoach_Stage2_Level3_Reconciled_Target_v1.7.xlsx`, especially `ENG Approved v1.7` and `TARGET Refinements v1.7`.
- Reconciliation register v0.4, Product Decisions v1.3, PSR-01–04 and ENG-01–08 approvals.
- Codex observed implementation gaps, not verified against deployed Convex records.

## Fixed technical policies
- **ENG-01 same-day**: sequence sorted by actual `sessionDate`, known `actualStartMinute`, then immutable session ID. Missing times after known times; never derive actual time from planned time.
- **ENG-02 account lifecycle**: invitation tracked independently; create/link active UserAccount only after Clerk-verified acceptance, secure one-time bootstrap for first Admin.
- **ENG-03 imports**: stable namespace/entity/external identifier, fingerprints and idempotent retries; no automatic name-only joins.
- **ENG-04 series reuse**: reactivate identical inactive Coach+Sport+roster series; preserve original history; resume same `sessionSequenceNumber` stream.
- **ENG-05 grant management**: Admin can grant/revoke sport-scoped CoachStudent; revocation is non-destructive; resource-level ClassReview/Media privacy unchanged.
- **ENG-06 migration**: verify/back up development first, preserve legacy tables/APIs and baseline, require separate production approval and rollback rehearsal.
- **ENG-07 profile edits**: minimal optimistic concurrency check; stale edits rejected/refreshed; richer attribution deferred.
- **ENG-08 old APIs**: prevent unauthorized public Convex calls and destructive review operations while keeping Stage 1 working.

## Dependencies and verification gates
| Wave | Work | Required acceptance gate | Risk control |
|---|---|---|---|
| 0 — Safe baseline | Confirm branch/deployments without secrets, save dev backup, inventory active Stage1 APIs and regression tests, verify current behavior | Stage1 student/review/history flows pass; dev deployment unmistakably separate from production | No production changes; stop on ambiguous environment |
| 1 — Identity | Clerk setup, pending AccountInvitation, UserAccount verified identity, first-Admin bootstrap, one-to-one Coach link | Invite/accept/revoke/resend tested; no duplicate Coach; last Admin protected | Identity lifecycle idempotence, server-side role guard |
| 2 — Access | CoachStudent grants and StudentSport.status, secure shared profile + legacy public endpoints | Cross-sport and cross-coach denied; revocation preserves data; Stage1 still passes | Test object-level ACL against guessed record IDs |
| 3 — Series and sessions | Canonical studentSetKey, collision preflight, inactive-series reactivation, immutable roster, plannedDate/sessionDate/actualStartMinute | Identical inactive series reuses ID; no concurrent duplicate; sequence resumes after pause | Race-safe mutations, no fabricated history |
| 4 — Plan/review lifecycle | Implement Session, Plan, Participation, Review, Media mutations and ownership guards | Session/Student uniqueness, absent has no number/review, media private to owner/Admin | Field and status validation, negative auth tests |
| 5 — Sequence engine | Student+Sport cumulative across coaches, stable same-day ordering, backdated attendance correction renumbers all later attended | Known/unknown time order stable; multi-coach test; baseline offset unchanged | Atomic/retry-safe recalculation and recalculation scope |
| 6 — Import | SourceMap identity, Batch/RowResult, preview/validate/commit, dry-run, repeat/retry | Same source rerun no duplicates; ambiguous rows blocked; audit reflects each outcome | No name-only merge, robust partial-failure handling |
| 7 — Lifecycle safety | Sport deactivation, group transition, student deletion dependency check | Original history intact; unrelated sports/coaches unaffected; unsafe deletion blocked | Transactional changes, historic references stable |
| 8 — Cutover/release readiness | Compatibility adapters, dev migration rehearsal, migration reconciliation, regression/UAT, rollback exercise | Stage1 data and new Stage2 data verified; documented go/no-go | Production cutover requires separate explicit approval |

## Implementation task separation
1. **Physical schema changes**: new AccountInvitation, UserAccount, CoachStudent, ImportBatch, ImportRowResult, ImportSourceMap; additional target fields/status and necessary indexes.
2. **Backend application changes**: permission guards, ClassSeries identity/reuse, Session/Plan/Review/Participation lifecycle, sequence engine, optimistic concurrency, import orchestration.
3. **Migration changes**: legacy string ID bridging, Tennis baseline retention, existing-series collision remediation, stable source mapping, fallback/rollback.
4. **Frontend changes**: invite/admin, profile conflict feedback, Class Plan/Review and import UI, errors and confirmations.

## Tests to write before approving a merge
- Unauthorized legacy `reviews.list/create/remove` and direct profile-ID calls fail.
- Coach T authorized for Harper Tennis cannot read Harper Ski or another Coach's private Tennis reviews/media.
- Two Coaches editing same StudentSport profile: stale write rejected; accepted update retained.
- Inactive ClassSeries with matching exact roster is reactivated and continues from prior session maximum; changed roster creates different series.
- Two same-day classes sorted known actual start then unknown then immutable ID; correction changes later numbers without changing baseline.
- Admin invitation re-send/revoke and acceptance retries do not create duplicate accounts or coaches.
- Imports rerun with same source identity do not duplicate records; name-only ambiguous matching is rejected.
- Stage1 review history and class numbering remain stable throughout development and migration rehearsal.

## Stop conditions
Stop work and request human review if any command targets production unexpectedly, historical baseline would be recomputed from incomplete data, unauthenticated public access would be deployed, or migration creates/overwrites records without tested rollback.

## Immediate next action
Proceed to **Wave 0 read-only safety/compatibility inventory** in Cursor, followed by a reviewed development-environment backup. Do not begin Waves 1–8 until baseline and environment checks pass.
