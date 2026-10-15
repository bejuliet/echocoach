# EchoCoach Stage 2 — Master Specification Index

**Version:** 0.1 (working baseline)  
**Updated:** 2026-10-15  
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
| ST2-01 | Homepage, sport selection, navigation | Decisions agreed; v1 spec drafted, final approval pending | Not verified |
| ST2-02 | Authentication and coach account | To design | Not verified |
| ST2-03 | Students and profiles | To design | Not verified |
| ST2-04 | Classes / class series / class sessions | To design | Not verified |
| ST2-05 | New Class Plan | To design | Not verified |
| ST2-06 | New Class Review | Partial draft and feedback | Stage 2 not verified |
| ST2-07 | Media | To design | Not verified |
| ST2-08 | Cross-workflow integration review | Planned | Not verified |
| FUT-01 | Booking and class-centric homepage | Deferred | Not verified |
| FUT-02 | Student-facing WeChat | Deferred | Not verified |

## Document locations (planned)
- `01_PRODUCT_DECISIONS.md` — decisions and open questions.
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
