# EchoCoach Stage 2 — New Class Plan Implementation Specification v1.0
**Status:** Approved functional design; implementation deferred until cross-workflow review. **Date:** 2026-10-16.

## 1. Scope and design authority
This is an implementation-ready *workflow contract*, not authorization to code. Cross-check exact entity/field names against the authoritative Level 3 workbook and inspect existing Convex queries, mutations, authentication, Stage 1 voice input and AI patterns before implementing. AI context-selection and recommendation rules remain explicitly deferred until Students & Profiles design and realistic test data.

## 2. User journey
1. From Homepage, tap **New Class Plan**. Sport is inherited from active homepage sport; no redundant sport picker.
2. **Class Context:** select Class Series (filtered by coach and sport), then Class Session (filtered by series). Display all enrolled students with View Profile links. A student selection is not required: a plan is session-level.
3. Session picker shows latest session numbers first; planned dates are clearly labeled *planned*, not actual. No auto-select of a potentially incorrect existing session. Offer **Create New Session**, proposing next series sequence number and optional plannedDate.
4. Confirming creation persists ClassSession immediately, independently of a plan, and selects the newly created session. If user leaves, the session remains. Use server-side atomic sequence assignment and uniqueness enforcement.
5. On session selection, look up existing ClassPlan by classSessionId. If present, offer View/Edit the same plan; never create a duplicate.
6. **Create Class Plan:** one scrollable page containing Q1 Class Goal, Q2 Class Agenda, Q3 Student-Specific Notes (one optional unstructured free-text field). Each field supports typing and voice/transcription on the same screen.
7. Automatically request AI initial suggestions using available learning context; prefill only untouched/empty fields. Do not block manual editing or overwrite user changes; if AI fails, manual creation remains available.
8. On **Review & Save**, automatically polish available text for grammar, precision, concision, and structure, preserving coach intent, student names, activities, numbers and constraints. Show polished result for coach review/edit; AI failure falls back to original text.
9. Coach explicitly saves; all three content fields may be empty according to existing model optionality. No draft/final status is introduced. Subsequent View/Edit updates the same plan. A changed plan must not silently mutate saved reviews.

## 3. Data contract (reconcile with workbook)
- ClassSession: stable technical ID; classSeriesId; sessionSequenceNumber; optional plannedDate; sessionDate remains the actual date confirmed at Class Review, not during Class Plan.
- ClassPlan: one per ClassSession; classSessionId, classGoal, classDrills (UI label: Class Agenda), plus Q3 optional free-text student notes mapped to **proposed `ClassPlan.studentNotes` (Stage 2 product-approved addition)**. This field is not in the prior locked core model; physical schema and migration require validation at integration review. Do not deploy schema now.
- Class Series roster is displayed read-only and used as context; Q3 is not parsed into separate per-student records.
- Coach and sport scope is enforced server-side, not only through UI filtering.
- Existing model may combine session creation with createClassPlan: separate session creation from plan upsert without breaking existing lifecycle integrity.

## 4. Conceptual operations (names are not prescribed)
- listCoachSeries(activeSport), listSeriesSessions(classSeriesId), listSeriesStudents(classSeriesId), getStudentProfile(studentId).
- createClassSession(classSeriesId, plannedDate?) => persisted session ID and assigned next sequence; handle concurrent creation.
- getClassPlan(classSessionId) => zero or one; createOrUpdateClassPlan(classSessionId, optional goal, agenda, notes) => upsert one plan.
- suggestClassPlan(context) => optional AI initial content; automatic trigger, cancel stale requests on context changes; preserve edits.
- polishClassPlan(content) => edited draft proposal, never auto-persist; manual fallback.

## 5. States and exceptions
- Loading series, sessions, roster, existing plan, student profile; empty series/roster; unauthorized access; offline/timeout; failed create/save; duplicate plan; stale AI results; recording permission denied; navigation with unsaved edits.
- Protect edits on navigation, sport changes, session switches, and returning from profile. Keep current edits if generation/polishing fails.
- Do not mistake plannedDate for confirmed sessionDate. Date changes do not change session identity.
- Existing plan may be edited before or after lesson; no automatic propagation into Class Review.

## 6. Acceptance criteria / test matrix
1. Series list limited to coach and active sport; no sport selection on plan screen.
2. Series change refreshes session list and roster, clearing stale dependent state.
3. New session persists immediately with unique next number and optional plannedDate; remains without a plan.
4. Existing session and plan selected => View/Edit, no duplicate.
5. Q1/Q2/Q3 may be empty and saved; Q3 is a single optional free-text field.
6. Automatic AI suggestion only populates untouched fields; manual edits always win, including late AI response.
7. AI suggestions work with incomplete learning profiles and never claim unsupported student facts.
8. Voice transcription inserts into intended section; errors leave typed text intact.
9. Review & Save triggers polishing; preserves names, durations, and coach intent; coach edits final result before explicit Save.
10. AI unavailable => manual save succeeds; save failure leaves content intact.
11. Existing plan edits update same record; saved Class Reviews unchanged.
12. Context switch/exit protects unsaved changes; profile navigation preserves state.
13. Planned date is optional and distinct from actual sessionDate; no date-based identity.
14. Concurrent new-session creation does not allocate duplicate sequence numbers.

## 7. Deferred work / dependencies
- Detailed learning-profile context selection, recency weighting, mixed-level group synthesis, and AI prompt/quality thresholds: design during Students & Profiles and cross-workflow integration, with 5–10 realistic cases.
- The Level 3 workbook records optional `ClassPlan.studentNotes` as a Stage 2 addition; validate physical schema compatibility and migration before implementation.
- Review how AI outputs are labeled/attributed and how coach can regenerate without overwriting edits.
- Implement only after all Stage 2 workflows and cross-workflow integration are approved.

## 8. Visual authority and return scenario
- The agreed Homepage uses **three bottom navigation tabs: Home, Classes, Students**.
- The primary Class Plan flow contains exactly **four visual screens**: Homepage → Class Context → Create Class Plan → Review & Save.
- Existing Plan View/Edit is a separate re-entry path and is not a fifth creation step.
- **No Save Draft button**; only Save Plan after coach review.
- Keep a stable session if a coach leaves after Create New Session without saving a plan.


## v1.1 Classes & History integration addendum (FOR REVIEW)
- Entry from Plan Archive: carry series/session filters into Plan Context; validate authorization, active sport, stale selection.
- Reuse session selector and immediate create; stable session ID, server-assigned creation-order sequence; no plan auto-created.
- Independent 1–4-week recurring slots may suggest an overrideable plannedDate; never auto-create session.
- Date edits do not renumber; empty-session deletion may renumber display sequence only, so always reference stable session ID.
- No direct media upload added to Plan workflow.
- Test archive prefill, existing plan View/Edit, orphan session, duplicate retry, deletion renumbering, cross-sport access.
