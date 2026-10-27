# EchoCoach Stage 2 — Student Workflow implementation and data notes

**Version:** 1.0 — 2026-10-27

**Status:** Functional/UI approved; schema and implementation not yet reviewed/implemented.

## Approved data requirements
1. `Student.dateOfBirth` optional date. Display age computed at render time.
2. `StudentSport.status` active/inactive is authoritative within each sport. Existing global `Student.status` still needs lifecycle interpretation.
3. Class ratio derived from `ClassSeriesStudent` membership count, 1:1–1:4; do not add `classType` as redundant persistent column. Include ratio in Class Series name or always-visible display.
4. `LearningMilestone.achievedDate` history retained.
5. `CapabilityRating` is latest value per key (no assessment history).
6. Existing Stage 1 attendance baseline remains authoritative; don't reconstruct missing old sessions.

## Unresolved technical policy (do not silently decide during migration)
- Deactivation of a student in group 1:2–1:4 Class Series: confirm warning and how series remains active, without modifying immutable student membership.
- Permanent deletion where student appears in shared media or session records: define exact retention, detagging, and dependent-review deletion, including multi-sport identities. Preserve other students' data.
- Reconciliation of global `Student.status` with sport-specific `StudentSport.status`.
- User-editable displayed student ID vs stable system identifier / legacy migrated IDs.
- Class Series custom names: protect required derived ratio visibility when student membership is immutable, and handle records from prior releases.
- Existing index/query coverage and transactional safeguards for 1:1 auto-deactivation.

## Upstream references
- Approved CH-01–CH-15 Classes & History semantics in Product Decisions log.
- Existing Class Review, Class Plan and Gallery workflows are reused.
