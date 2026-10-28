# EchoCoach Stage 2 — Physical Schema Implementation Change Plan v0.1
Date: 2026-10-28
Status: Technical proposal for review, NOT approval to change code or production data.

## Authority and inputs
- Level 3 reconciled target workbook v1.6 (retains v1.5 sheets; addenda specify new approved technical decisions).
- Product Decisions v1.3 and approved Step 4 choices: same-day stable ordering, renumber on correction, ClassSeries-based review/media authorization, retain legacy Stage 1 tables.
- Codex read-only audit of `stage2` branch (actual Convex schema and functions). No deployed data inspected.

## Milestones, dependencies, acceptance gates
| Wave | Dependency | Work | Verification before merge |
|---|---|---|---|
| 0 | None | Back up dev, freeze Stage 1 compatibility, capture existing tests and API surface, inspect deployment configuration without secrets | Current Stage 1 review/history works unchanged |
| 1 | 0 | Implement Clerk, UserAccount, first-Admin bootstrap and backend role/identity guards | Unauthorized public calls fail; last Admin protected; Coach identity one-to-one |
| 2 | 1 | Add CoachStudent sport-scoped grants; StudentSport.status; auth guards on shared profile and legacy endpoints | Cannot access unauthorized sport/student, private reviews/media, or public destructive methods |
| 3 | 2 | Add ClassSeries canonical roster key and immutable roster safeguards; ClassSession.plannedDate, time representation and session allocation | Same Coach/Sport/student-set conflict handled retry-safely; planning date ≠ occurrence date |
| 4 | 3 | Implement ClassPlan, SessionParticipation, attendance, ClassReview and media lifecycle | No absent sequence; one review/participant; owning Coach/Admin ACL |
| 5 | 4 | Deterministic cross-coach Student+Sport numbering and correction recalculation | Multiple same-day classes deterministic; backdated corrections renumber; Stage 1 offset stable |
| 6 | 2–5 | Admin import tables and preview/validate/commit, dedupe, source mapping, audit | Re-running source produces no duplicates; failure reports actionable |
| 7 | 3–6 | Deactivation, dependency checks and group-roster transitions | Original history preserved; no unrelated coaches/sports changed; unsafe deletion blocked |
| 8 | all | Development cutover, compatibility adapters, regression tests, planned rollout | Original Stage 1 history, counts and UI verified; rollback rehearsed |

## Technical decisions still open
ENG-01 exact same-day sort encoding and null-time position; ENG-02 Clerk invitation state; ENG-03 source identity/namespace and import fingerprints; ENG-04 inactive-series duplicate/reuse policy; ENG-05 grant lifecycle; ENG-06 migration controls; ENG-07 stale-write controls; ENG-08 legacy API security remediation scope.

## Safety rules
No production migration or schema replacement until explicitly reviewed and authorized. Do not turn Stage 1 review timestamp into ClassSession actual date. Do not fabricate missing history. Keep old `classes` and `reviews` until verified cutover. Every public Convex query/mutation must enforce server-side authorization. Convex indexes are not unique constraints by themselves; mutation-level checks are required.
