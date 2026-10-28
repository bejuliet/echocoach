# EchoCoach Stage 2 — Admin Account & Data Initialization — Implementation Review v1.0

**Status:** Product rules approved; physical schema and technical choices require implementation review. No code or migration executed.

## Identity / authorization
- Clerk authenticates users and manages invitation, password, sessions, deactivation integration.
- Convex UserAccount record references Clerk identity and role; one Coach-role account maps to one Coach.
- Server-side check on every read/write, scoped by authenticated Coach, CoachStudent grant, sport, and ownership of ClassSeries/Session/Review/Media. Admin is privileged but audited.
- CoachStudent is an explicit relationship; shared Student identity is not implicit blanket access.
- Approved: Coach A and Coach B with valid relationships and matching sport may view/edit the **same** StudentLearningProfile (StudentSport key), including goal, milestone state and current capability ratings.
- A shared profile edit by one Coach is visible to the other. No capability-rating history is added.
- Protect from stale edits at minimum via updatedAt/version check or equivalent; exact strategy TBD. Log collaborative provenance/audit as future enhancement.

## Account lifecycle
- Developer bootstrap first Admin once, audit and disable bootstrap path.
- Admin invitation creates pending entry; activate one-to-one Clerk ID / UserAccount / Coach link safely and idempotently.
- Confirm role changes; prevent deactivating/demoting last Admin.
- Deactivation blocks live sessions and protected Convex operations without deleting records.

## ADM-02 import pipeline
1. Authenticated Admin selects Student or Class initialization and source (file / controlled Stage 1 Convex).
2. Normalize and map; resolve stable source identifiers; prepare dry-run rows.
3. Validate entity constraints and access grants; do not match by name alone.
4. Require Admin confirmation and materialize committed change plan.
5. Store ImportBatch, per-row outcome, actor and timestamps, and expose summary.

### Validation invariants
- Student uniqueness/matching by source key and explicit linking decision.
- CoachStudent unique coachId+studentId; access scoped by selected sport when reading StudentSport and learning profile.
- StudentSport unique studentId+sportId, shared by authorized Coaches.
- ClassSeries identity coach+sport+exact normalized Student Set; ratio derived not independent field.
- Preserve historical StudentSport.sequenceBaseline; never synthesize absent sessions/reviews/media.
- Duplicate/retry-safe import with recoverable errors.

## Schema review additions
Proposed entities/fields are enumerated in `EchoCoach_Stage2_Level3_Admin_Review_v1.4.xlsx` sheet **ADM Final Decisions v1.4**. Physical schema migration awaits approval.

## Open technical choices
- Clerk invitation lifecycle and role claim sync.
- CoachStudent grant/revoke, overlap and effective membership, authorization policy for basic Student fields.
- Concurrent shared profile edit conflict policy and minimum last-write safeguards.
- ImportBatch transaction and resumable/retry boundaries, imported-file storage retention.
- Multi-coach media and Class Review sharing policies (remain record-specific).
