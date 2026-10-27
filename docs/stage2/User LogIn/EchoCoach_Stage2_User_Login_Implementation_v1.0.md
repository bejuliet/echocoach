# EchoCoach Stage 2 — User Login Implementation Specification

**Version:** 1.0 — Design implementation contract; provider-specific details pending  
**Date:** 2026-10-27  
**Reference:** `EchoCoach_Stage2_User_Login_Functional_UI_v1.0_APPROVED.docx`  
**Visual:** `LOG-01_User-Login_Approved_v1.png`

## 1. Scope and authority
This defines implementation requirements for **login and session restoration only**. Account creation/initialization, invite flows, user management, role changes, administrative data import, and detailed password-reset workflow are separately designed. It records existing product decisions, **not confirmation that these features are implemented**.

## 2. Identity and permissions
- Users enter username **or** email and password. Authentication backend resolves the user identity and assigned `Coach` or `Admin` role; no role picker or client-chosen authority.
- Successful login establishes a secure session and directs both account types to the existing shared Home Page.
- Coach can use authorized coaching functions; cannot execute account management or backend-data administration actions.
- Admin may access coaching functions and authorized administrative operations. Every privileged server mutation/query checks role and relevant coach/resource ownership; hiding UI elements alone does not authorize requests.
- Resolve authenticated identity to the appropriate internal Coach/account record. Exact identity/role storage is **pending schema and auth-provider selection**; do not assume a schema not yet approved.

## 3. Login UI states
- Username/email input, password masked by default with Show/Hide toggle, Keep me signed in selected by default, Login, Forgot password.
- Disable submit while required fields are blank or submission pending; show progress during authentication; prevent double submission.
- Authentication failure: show generic error, remain on Login, never disclose whether user/email exists.
- Connectivity/provider outage: distinct retryable error, remain on Login.
- Password-reset entry point visible; route requires future Account Initialization & Management integration, and must not imply reset is operational until provider wiring exists.
- Login screen is sport-independent. Tennis art is only the approved visual example, not a sport/role prerequisite.

## 4. Session lifecycle
- On app startup, verify provider-managed session; if valid, open Home without showing Login.
- On missing, expired or revoked session, open Login; clear any cached protected views as appropriate.
- Keep me signed in enables provider-supported persistent sessions; **never** store user password or authentication tokens in code or insecure plaintext/local storage.
- Logout ends provider session and clears protected client state; protected routes and backend functions reject subsequent unauthenticated access.
- Session refresh duration, storage strategy, multi-device revoke, and timeout policy are **implementation-review decisions**, not yet product approved.

## 5. Integration boundaries
| Integration | Contract | State |
|---|---|---|
| Auth provider | Secure password auth, session restoration, logout, identity lookup | Select and inspect existing project setup |
| Convex account mapping | Stable authenticated identity ↔ user/coach record and role | Schema check required |
| Home | Navigate to shared Home on success; restore stored sport preference | Already designed, integration pending |
| Settings | Coach/Admin visibility; logout entry | Settings workflow designing separately |
| Account initialization | Create initial admin and coach accounts securely | Separate future workflow |
| Password reset | Provider-supported reset workflow | Separate detailed design |

## 6. Security and privacy implementation guardrails
- Use established authentication library/provider; hash and salt passwords through provider; do not implement custom password storage.
- Validate sessions and permissions server-side for every sensitive access.
- Use rate limiting/throttling and generic errors; avoid logging password input, raw auth tokens or personally identifying secrets.
- Redirects must be constrained to trusted internal routes. Minimize error-message information leakage.
- Source workflow includes example credentials. Treat them as potentially exposed, rotate any credentials actually used, and never copy them into repositories, seeding scripts, docs or tests.

## 7. Acceptance and test matrix
| Test | Expected |
|---|---|
| Valid Coach credentials | Authenticated; common Home; coaching access; admin APIs denied |
| Valid Admin credentials | Authenticated; common Home; permitted admin access |
| Coach attempts admin route/API | Backend denies despite forged UI/request |
| Wrong password/nonexistent account | Same generic error; stay on Login |
| Missing credentials | Local validation; no submission |
| Repeated submit | One effective auth attempt while in flight |
| Valid persistent session | Skip Login on reopening |
| Expired/revoked session | Login required; protected content inaccessible |
| Logout | Provider session ended; subsequent protected access denied |
| Network/provider unavailable | Distinct retriable error without leaking details |
| Change active sport after login | Honors selected preference per existing Home workflow |

## 8. Open technical decisions / implementation gate
1. Inspect current EchoCoach auth integration and select provider if absent; record supported username/email behavior.
2. Define identity and role schema (including the relationship between Coach and Admin) with Account Management design.
3. Finalize session persistence/expiration, security controls and password-reset handler.
4. Confirm precise Settings/Logout route wiring.
5. Validate end-to-end with test accounts whose passwords are stored only in secure dev configuration and never copied from source documents.

**Approval boundary:** Functional/UI and product behavior approved; this file is a proposed implementation contract. No code, credential initialization, schema deployment, or provider configuration has been performed.
