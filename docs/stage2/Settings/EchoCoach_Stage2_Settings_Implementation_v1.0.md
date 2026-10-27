# EchoCoach Stage 2 — Settings Module Implementation v1.0

**Updated:** 2026-10-27

## Purpose
This document translates the approved Settings module into implementation-oriented notes.

## Screens / routes
- `/settings` — Settings landing page
- `/settings/profile` — My Profile
- `/settings/preferences` — App Preferences
- `/settings/app-info` — App Info
- `/settings/account-management` — Admin only, separate workflow
- `/settings/student-initialization` — Admin only, separate workflow
- `/settings/class-initialization` — Admin only, separate workflow

## Role gating
- Use authenticated account role from the login/session layer.
- Hide admin-only entries in UI for coach accounts.
- Enforce admin-only access in backend/server-side actions and route guards.

## Data dependencies
### My Profile
- userId
- displayName
- email (read-only in Stage 2)
- role

### App Preferences
- preferredLanguage
- defaultSport

These preferences should persist across sessions and devices where applicable.

## Behavior notes
- Updating default sport should align with the existing selected-sport preference model from the Home workflow.
- Changing preferences must not interrupt an active Class Review or Class Plan without the same unsaved-work safeguards already defined.
- Logging out clears the active authenticated session but should preserve non-sensitive saved preferences.

## Technical review items
1. Confirm where user profile and preference data are stored (auth provider metadata vs application database).
2. Confirm whether email change remains fully out of scope for Stage 2.
3. Define exact logout confirmation interaction.
4. Define route guarding approach for admin-only settings pages.
5. Reconcile language preference with current bilingual support implementation.

## Not yet designed here
The following remain separate workflows and are not implemented from this document alone:
- Account Management
- Student Initialization
- Class Initialization
