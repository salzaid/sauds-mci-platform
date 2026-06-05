# Saud's MCI Platform — Project TODO

Last updated: 2026-06-05 | Version: 926ca743

---

## Core Platform Modules

- [x] Scene Triage — SALT, START, JumpSTART (paediatric) decision trees
- [x] Patient Tracking — HICS 254-equivalent immutable event log
- [x] Hospital Command Dashboard — CO-S-TR tiles (triage tally, OR queue, blood bank, ICU census)
- [x] Incident Management — full lifecycle (ACTIVATED → ESCALATED → DEACTIVATED → CLOSED)
- [x] OR / Surgical Queue — 11-state machine, DCS flag, MTP blood product tracking
- [x] Resources & Logistics — real-time inventory (ventilators, ICU/OR beds, blood products, PPE, medications)
- [x] Transport Management — inter-facility manifests and status tracking
- [x] ICS Forms — HICS 201, 202, 203, 204, 205A, 213, 214, 254
- [x] WHO EMT MDS Reporting — 85-item daily situation report
- [x] Communications — incident-scoped messaging by channel and priority (ROUTINE / URGENT / FLASH)
- [x] After-Action Review — KPI dashboard (mortality rate, OR throughput, identity confirmation rate)
- [x] Public Family Reunification Portal — privacy-preserving status lookup (no PHI)

---

## Authentication & Access Control

- [x] Custom email/password authentication (bcrypt 12 rounds, JWT session cookies)
- [x] HTTP-only, Secure, SameSite session cookies signed with JWT_SECRET
- [x] Invite-only access model — no public self-registration
- [x] Invite flow: admin creates invite → recipient sets password → account created → signed in
- [x] 7-day expiring invite tokens (48-char nanoid)
- [x] Invite resend / revoke from Admin panel
- [x] Request Access form on landing page (notifies admin, logged to DB)
- [x] Forgot password flow (reset token stored, admin-visible reset URL)
- [x] Reset password page (/reset-password?token=...)
- [x] Change password dialog (authenticated users, sidebar dropdown)
- [x] Admin: set password for any user
- [x] Manus OAuth fallback (backward compatible for existing OAuth users)
- [x] Dual-auth context (custom JWT first, Manus OAuth fallback)

---

## Admin Panel

- [x] Users tab — search, list all users with role badges and status
- [x] Full profile editing — name, email, job title, phone, role, language, facility, active status
- [x] Set Password for any user (admin/superadmin)
- [x] Delete User (superadmin only, cannot delete own account)
- [x] Add User directly (superadmin only, no invite required)
- [x] Invitations tab — send, view, revoke, resend/extend
- [x] Access Requests tab — review, one-click Send Invite, reject, pending badge counter
- [x] Facilities tab — create and edit hospital/facility records
- [x] Audit Log tab — chronological record of all significant actions
- [x] adminProcedure accepts both 'admin' and 'superadmin' roles

---

## Demo & Testing

- [x] Demo mode at /demo — read-only, no login required, all 11 modules
- [x] DemoLayout with yellow DEMO banner and full sidebar navigation
- [x] demoRouter — public read-only tRPC procedures for all data types
- [x] Demo landing page with module grid and sample data summary
- [x] 7 demo accounts (one per role, password Demo@1234)
- [x] Demo credentials banner on login page (collapsible, auto-fill on click)
- [x] Sample data: 3 incidents, 43 casualties, 9 OR cases, 7 ICS forms, 10 comms, 17 resources, 2 EMT MDS reports

---

## Internationalisation

- [x] Bilingual EN/AR support throughout platform
- [x] RTL layout via document.dir on language switch
- [x] Cairo font (Arabic) + Inter font (English)
- [x] Language preference persisted in localStorage
- [x] Language switcher in sidebar dropdown and demo sidebar

---

## Database & Backend

- [x] 16-table MySQL schema (Drizzle ORM)
- [x] tRPC 11 end-to-end type-safe API
- [x] All feature routers: incidents, casualties, orCases, resources, transports, icsForms, emtMds, comms, admin, dashboard, invitations, customAuth, demo, system
- [x] FHIR-aligned data models (FHIR R4/R5 compatible shapes)
- [x] Provisional identity model (triage tag → civil ID reconciliation)
- [x] Immutable audit trail on all clinical records
- [x] password_reset_requests table for admin-visible reset links

---

## Testing

- [x] 61 unit tests passing (Vitest)
- [x] auth.logout.test.ts (1 test)
- [x] triage.test.ts (21 tests — SALT algorithm, OR state machine, provisional ID)
- [x] routers.test.ts (22 tests — OR transitions, role guards, incident codes)
- [x] invitations.test.ts (17 tests — token generation, expiry, claim validation, admin guard)

---

## Documentation

- [x] README.md v1.1 — deployment guide, auth, demo accounts, standards, MIT licence
- [x] docs/TECHNICAL.md v1.1 — architecture, custom auth, demo mode, security, roadmap
- [x] docs/USER_GUIDE.md v1.1 — end-user guide for healthcare workers (all modules, FAQ)
- [x] LICENSE — MIT licence credited to Saud N Alzaid

---

## Planned for v2

- [ ] Email delivery integration (Resend / SendGrid / SMTP) for password reset and invite emails
- [ ] Real-time WebSocket push (currently polling-based, 10–30s intervals)
- [ ] FHIR R4/R5 bulk export endpoint
- [ ] Barcode / NFC tag scanning integration (requires hardware)
- [ ] Voice input for triage (browser API integration)
- [ ] Offline-first PWA service worker
- [x] Full Arabic translation coverage — 382 keys per language (auth, triage, incidents, OR, resources, transport, ICS, comms, EMT MDS, AAR, admin, dashboard, portal)
- [ ] PDF export for ICS forms and EMT MDS reports
