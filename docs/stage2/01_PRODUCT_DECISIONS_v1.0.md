# EchoCoach Stage 2 — Product Decisions

**Version:** 1.0  
**Updated:** 2026-10-27

This version carries forward prior Stage 2 decisions and adds the approved Settings decisions below.

## User Login — approved
- Login requires username/email and password.
- No Admin/Coach selector on the login screen; role is determined automatically from the authenticated account.
- Successful login opens the shared Home Page.
- Coach permissions exclude account management and backend data management.
- Admin permissions include coaching functions plus administration.
- Keep users securely signed in by default.

## Settings — approved
- A Settings icon appears on the Home Page and opens the Settings module.
- Shared Settings options for Coach and Admin: My Profile, App Preferences, App Info, Log Out.
- Admin-only Settings options: Account Management, Student Initialization, Class Initialization.
- Student Initialization and Class Initialization are admin-only in Stage 2 and treated as rare / one-time or occasional setup workflows.
- In the future, student/class initialization may be opened to coaches.
- My Profile allows display name and password updates; email is read-only for Stage 2.
- App Preferences includes Language and Default Sport.
- Log Out ends the session and returns to the Login page.
- UI role visibility is convenience only; backend permissions must independently enforce access control.
