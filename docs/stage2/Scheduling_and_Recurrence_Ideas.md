# EchoCoach — Scheduling & Recurrence: Detailed Idea Notes

Created: 2026-10-22  
Status: Exploration / backlog. **Not an approved implementation specification.**

## Traceability
- **Originating discussion:** EchoCoach Stage 2 → Classes & History → Create/Edit Class Series; October 21–22, 2026.
- **Saved Project resource:** User reported saving this conversation to the EchoCoach Stage2 Project resources.
- **Conversation link:** Pending — insert the verified ChatGPT share URL when available; do not invent a URL.
- **Search phrases:** “Harper doing every Tuesday and thursday”; “predicted next time slot”; “today could have a new class session”.
- **Master index:** `Product_Idea_Backlog.md`, IDs SCH-01 through SCH-04.

## Context and motivation
A Class Series is identified by coach, sport, and student set. One series may meet more than once per week, or on different alternating-week schedules. A recurring time slot is a schedule description, **not** a Class Session; it does not automatically create sessions or increase the completed-session count. Sessions remain numbered across the entire series, regardless of day.

## SCH-01 — Recurrence frequency per time slot
**User problem:** A coach teaches the same student(s) on multiple recurring days, sometimes at different frequencies.

**Illustrative scenario:** Harper has Tuesday 6–7 PM every week and Thursday 6–7 PM every two weeks, both in one Class Series.

**Candidate form behavior:**
- Optional Time Slot 1: day, start/end time, recurrence frequency every 1, 2, 3, or 4 weeks.
- `+ Add Another Time Slot` to configure additional slots independently.
- For frequencies longer than one week, collect an anchor/first-occurrence date to disambiguate which week the slot falls on.
- Preserve the earlier decision to **remove mandatory First Class Date** from Class Series creation. An anchor date, if adopted, is a recurrence rule input and does not create Session #1.

**Open design questions:** Whether weekly slots also need an anchor; how to handle holidays, temporary pauses, and changes to a slot; exact model structure; whether configuration is Stage 2 scope or deferred.

## SCH-02 — Suggested next session date
**User problem:** Coaches shouldn't repeatedly calculate and enter dates already implied by a recurring schedule.

**Candidate behavior:** When a coach creates a Class Session through (1) Classes / Class Series, (2) New Class Plan, or (3) New Class Review, offer the next predicted scheduled occurrence as an editable suggestion. Consider already-created sessions to avoid suggesting duplicate dates.

**Date integrity:** For a new or upcoming session, prediction can prefill optional `plannedDate`. For a post-class review, the coach must confirm the **actual** `sessionDate`; prediction must never silently become the authoritative actual date.

**Dependencies / unresolved:** SCH-01; ordering multiple slots; skipped and rescheduled lessons; past-session review entry; duplicates; time zones and local dates.

## SCH-03 — Home Page: Today's Classes
**User problem:** A coach wants to know which classes are expected today and take the appropriate next action without navigating through series lists.

**Candidate categories:**
1. **Planned:** An existing Class Session has `plannedDate` equal to today → Open Session / Class Plan.
2. **Expected:** Recurring schedule predicts a lesson today but no Class Session exists → Create Session.
3. **Needs Review:** A lesson appears to require a post-class review → Write Review (exact eligibility rules remain open).

**Critical distinction:** `sessionDate` is reserved for the confirmed date a lesson actually occurred. Do not label a future predicted date as a confirmed `sessionDate`. Future confirmed booking concepts are separate.

**Dependencies / unresolved:** SCH-02; duplicate detection; time-sensitive display rules; attendance and review completion; how alerts interact with sport filtering and Home action-first layout.

## SCH-04 — Advanced scheduling / booking
**Future Stage 3 opportunity:** Confirmed future bookings, cancellations, rescheduling, reminders, and notifications. Requires its own booking status and confirmed-future-date design; do not overload `sessionDate`.

## Scope and decision log
- **Already agreed in Classes design:** Multiple optional recurring time slots in one series; class-series identity remains coach + sport + student set; time slots do not generate sessions by themselves.
- **Proposed, not yet explicitly approved as a scope decision:** Adding per-slot 1–4-week recurrence configuration now rather than in a later release.
- **Backlog candidates:** Automatic date suggestion, Today's Classes, and advanced booking/reminders.
- **Documentation governance:** Do not migrate these ideas into approved Product Decisions or implementation specs until the user explicitly settles scope and details.
