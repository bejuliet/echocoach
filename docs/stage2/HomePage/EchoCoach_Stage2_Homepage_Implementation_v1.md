# EchoCoach Stage 2 — Home Page Functional & UI Specification v1.0

**Status:** Approved product decisions; technical details to validate against repository. **Date:** 2026-10-15.

## Approved decisions
- Mobile-first **Action First** homepage; retain EchoCoach logo and sport-themed photography.
- Top: coach greeting, Settings entry, active Sport selector.
- Two actions: **New Class Review** and **New Class Plan**.
- Bottom navigation: **Home / Classes / Students** (same across sports).
- Language belongs in Settings. Class-centric dashboard deferred until future booking functionality.

## Requirements
- **SC-01** Coach can select an active sport from Home.
- **SC-02** Sport change updates homepage and workflow theme/background.
- **SC-03** Sport change updates terminology, dropdowns, configuration, and sport-scoped records. No records from other sports appear in sport-specific workflows.
- **SC-04** Save sport preference to authenticated coach profile; persist across sessions/devices until changed.
- **SC-05** Keep navigation structure consistent across sports; use configuration rather than different screen architectures.
- **SC-06** Do not lose unsaved work on sport switch. MVP: switch from Home; confirm if future in-workflow switch affects drafts.

## Screen structure
1. Header: EchoCoach logo; Settings icon.
2. Greeting: `Hello, {displayName}!` (fallback `Hello, Coach!`); sport selector.
3. Primary solid button: `New Class Review` → existing Review intake, prefilter active sport.
4. Secondary button: `New Class Plan` → Plan entry (separate workflow).
5. Bottom tab bar: `Home | Classes | Students`; Home active.
6. Tennis and Ski share layout; configured backgrounds, overlay, accents, labels and icons differ.

## Logical data contracts (map to actual schema; do not blindly add tables)
- Authenticated `coachId` and `displayName`.
- Authorized Sport catalog: `sportId`, `displayName`, `enabled`, `themeKey`.
- Coach preference: `activeSportId` or equivalent persisted server-side per coach.
- Theme config: `themeKey` mapped to asset, overlay, color tokens, terminology.
- Active sport is shared context for Review, Plan, Classes, Students; backend validates sport and coach authorization on every query/mutation.

## Workflow
1. On login resolve coach, permitted sports, saved sport; render correct theme before main content.
2. Tap sport selector → show permitted sports → choose → save preference → update theme and filters; rollback if save fails.
3. New Class Review / Plan receive activeSportId; Classes / Students open filtered to active sport.
4. Settings entry opens settings; detailed implementation separate.

## Proposed edge-case defaults (require product confirmation)
- No saved sport and one permitted sport: auto-select; multiple: request selection.
- Saved sport inaccessible: request valid selection.
- No sports: clear empty state, disable sport actions.
- No records for active sport: keep create actions available.
- Image missing: use readable color/gradient fallback.
- Switching with unsaved work: warn/confirm, never silently discard.

## Acceptance tests
- [ ] Correct logo, greeting, two CTAs, and exactly 3 bottom tabs.
- [ ] Sport choices restricted to coach's permitted sports.
- [ ] Tennis↔Ski changes theme and all sport-specific filters, not nav structure.
- [ ] Preference persists across logout/login and devices.
- [ ] Review and Plan launch with sport context.
- [ ] Classes/Students receive sport filter context.
- [ ] Server-side authorization prevents cross-coach and cross-sport leakage.
- [ ] Save errors, missing theme, empty states, loading state are handled.
- [ ] Touch targets ≥44px and text readable over photo backgrounds.

## Implementation instructions for Cursor/Codex
Inspect existing Next.js/Convex routes, Coach/Sport schema, auth, assets, and Review entry before changing code. Reuse existing entities and components. Centralize active sport state; persist it with authorized backend mutation; add tests. Avoid implementing unapproved downstream workflows or unrelated refactors. Report any schema/route mismatch before proceeding.

## Deferred
Detailed Class Plan, Classes, Students, Settings, media, booking, class-centric dashboard.
