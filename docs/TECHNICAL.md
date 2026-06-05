# Saud's MCI Platform — Technical Documentation

**Document version:** 1.1  
**Author:** Saud N Alzaid  
**Audience:** Software engineers, DevOps/SRE, security engineers, QA  
**Status:** Implementation reference

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Model](#2-data-model)
3. [API Design](#3-api-design)
4. [Authentication & Authorisation](#4-authentication--authorisation)
5. [Module Specifications](#5-module-specifications)
6. [Database Schema Reference](#6-database-schema-reference)
7. [Triage Algorithm Implementation](#7-triage-algorithm-implementation)
8. [OR Case State Machine](#8-or-case-state-machine)
9. [Invite & Access Request Flow](#9-invite--access-request-flow)
10. [Demo Mode Architecture](#10-demo-mode-architecture)
11. [Internationalisation](#11-internationalisation)
12. [Testing Strategy](#12-testing-strategy)
13. [Performance Characteristics](#13-performance-characteristics)
14. [Security Considerations](#14-security-considerations)
15. [Deployment Topologies](#15-deployment-topologies)
16. [Roadmap](#16-roadmap)
17. [References](#17-references)

---

## 1. System Architecture

Saud's MCI Platform follows a **monolithic full-stack architecture** with a clean separation between client and server, connected via a fully type-safe tRPC API layer.

```
┌─────────────────────────────────────────────────────────┐
│  Client (React 19 + TypeScript + Tailwind CSS 4)        │
│  ┌──────────────┬─────────────────┬───────────────────┐  │
│  │ Dashboard    │ Triage / Track  │ Admin / Forms     │  │
│  │ Demo Mode    │ OR / Resources  │ Auth Pages        │  │
│  └──────┬───────┴────────┬────────┴──────────┬────────┘  │
│         │  tRPC over HTTP│                   │           │
└─────────┼────────────────┼───────────────────┼───────────┘
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│  Server (Node.js + Express 4 + tRPC 11)                 │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │incidents │casualties│ orCases  │ admin / invites   │  │
│  │resources │transports│ icsForms │ dashboard / comms │  │
│  │customAuth│   demo   │ emtMds   │ system / aar      │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Custom JWT auth + Manus OAuth fallback          │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Data Tier                                              │
│  • MySQL 8 / TiDB (Drizzle ORM, 16 tables)             │
│  • Manus Object Storage (S3-compatible)                 │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**tRPC over REST** eliminates the need for a separate API contract file, provides compile-time type safety from database row to React component, and reduces the surface area for integration bugs.

**Drizzle ORM** was selected for its lightweight footprint, explicit SQL generation, and superior TypeScript inference. The schema in `drizzle/schema.ts` is the single source of truth for both the database structure and all TypeScript types.

**Custom email/password auth** was chosen over Manus OAuth to eliminate the dependency on a third-party identity provider. Users sign in with email and password — no external account required. The system maintains backward compatibility with Manus OAuth for existing users.

**Polling over WebSockets** was chosen for v1 real-time updates. Dashboard tiles, the tracking board, and the OR queue refresh automatically on configurable intervals (10–30 seconds). Full WebSocket push is planned for v2.

---

## 2. Data Model

All clinical entities are modelled to be compatible with HL7 FHIR R4/R5 resource shapes, enabling future integration with national EHR systems without requiring a schema migration.

### Entity Relationship Summary

| Entity | Table | FHIR Equivalent | Notes |
|---|---|---|---|
| Incident | `incidents` | `EpisodeOfCare` (profile) | Root aggregate; all data is partitioned by `incidentId` |
| Casualty | `casualties` | `Patient` + `RelatedPerson` | Provisional ID generated at first contact |
| Tracking event | `casualty_events` | `Encounter` (chained) | Immutable append-only log |
| Triage assessment | `triage_assessments` | `Observation` (category=survey) | New row per reassessment; never updated |
| OR case | `or_cases` | `Procedure` + custom | 11-state machine |
| Resource | `resources` | `Device` + `Location` | Real-time inventory |
| Transport | `transports` | `Transport` (R5) / `Task` (R4) | Per-asset status tracking |
| ICS Form | `ics_forms` | `QuestionnaireResponse` | JSON payload per form type |
| EMT MDS report | `emt_mds_reports` | WHO EMT MDS | 85-item daily report |
| Communication | `comms_messages` | `Communication` | Scoped per incident and channel |
| Invitation | `invitations` | — | Platform-native access control |
| Access request | `access_requests` | — | Platform-native access control |
| Password reset | `password_reset_requests` | — | Admin-visible reset link log |

### Provisional Identity Model

In mass casualty incidents, patient identity is unknown for hours or days. The platform generates a deterministic provisional identifier at first contact using the format `{INCIDENT_CODE}-T{TAG_NUMBER_PADDED}` (e.g., `MCI-2026-ALPHA1-T0042`). This identifier persists as a secondary identifier even after civil identity is confirmed.

---

## 3. API Design

The platform exposes a single tRPC router tree at `/api/trpc`. All procedures are strongly typed end-to-end.

```
appRouter
├── auth.me / auth.logout
├── customAuth.login / register / changePassword / forgotPassword / resetPassword
│              adminSetPassword / listResetRequests
├── incidents.list / get / create / updateStatus / getBoard / delete
├── casualties.list / get / create / update / addEvent / getTimeline / getTriageHistory
│              addTriage / confirmIdentity
├── orCases.list / get / create / transition / updateBloodProducts
├── resources.list / upsert / delete
├── transports.list / create / updateStatus
├── icsForms.list / get / save / acknowledge
├── emtMds.list / get / save
├── comms.list / send / acknowledge
├── admin.listUsers / updateUser / createUser / deleteUser / listFacilities
│         createFacility / updateFacility / listAuditLogs
├── dashboard.overview / incidentDashboard / resourceSummary / aarKpis
├── invitations.list / create / resend / revoke / getByToken / claim
├── demo.* (all read-only public equivalents of the above)
└── system.health / notifyOwner / requestAccess / listAccessRequests
              updateAccessRequest
```

### Procedure Access Levels

| Wrapper | Requirement |
|---|---|
| `publicProcedure` | No authentication (demo routes, requestAccess, health, forgotPassword, resetPassword) |
| `protectedProcedure` | Valid session cookie (custom JWT or Manus OAuth) |
| `adminProcedure` | `ctx.user.role` must be `admin` or `superadmin` |

---

## 4. Authentication & Authorisation

### Custom Email/Password Authentication

The platform implements a custom authentication system in `server/routers/customAuth.ts`. The flow is:

1. **Registration:** User opens an invite link (`/invite/:token`), sets a password, account is created with the pre-assigned role, and a session cookie is issued immediately.
2. **Login:** User submits email and password at `/login`. The server fetches the user by email, verifies the password against the stored bcrypt hash, updates `lastSignedIn`, and issues a session cookie.
3. **Session:** The cookie is an HS256 JWT containing `{ userId, openId }`, signed with `JWT_SECRET`, valid for 7 days, HTTP-only, Secure, SameSite=None.
4. **Context resolution:** On every tRPC request, `context.ts` first tries to verify the custom JWT. If valid, it fetches the full user record by `userId`. If the custom JWT is absent or invalid, it falls back to Manus OAuth verification.

### Password Security

Passwords are hashed with **bcrypt at cost factor 12** using the `bcryptjs` library. This makes brute-force attacks computationally expensive (approximately 250ms per hash attempt on modern hardware). The plaintext password is never stored, logged, or transmitted after the initial hash operation.

### Password Reset

The `forgotPassword` mutation generates a 48-character nanoid token, stores it on the user record with a 1-hour expiry, and logs the full reset URL to the `password_reset_requests` table for admin review. The admin can then forward the URL to the user. A full email delivery integration (Resend, SendGrid, or SMTP) is planned for v2.

### Manus OAuth Fallback

For users who authenticated via Manus OAuth before the custom auth system was added, the context layer falls back to Manus OAuth verification if no custom JWT is present. This ensures backward compatibility without requiring existing users to reset their credentials.

### Role Hierarchy

```
superadmin
    └── admin
            └── incident_commander
                    ├── clinician
                    ├── triage_officer
                    └── logistics
                            └── viewer
```

Roles are stored as a MySQL enum on the `users` table. Each procedure explicitly enumerates the roles it permits — there is no hierarchical inheritance in the current implementation.

---

## 5. Module Specifications

### 5.1 Scene Triage Module

The triage module implements the SALT algorithm as a client-side state machine. The decision tree is encoded as a sequence of binary questions. The algorithm proceeds as follows: ambulatory patients → MINIMAL; non-ambulatory with unsurvivable life threat → EXPECTANT; abnormal vitals (RR < 10 or > 30, absent pulse, or failure to follow commands) → IMMEDIATE; otherwise → DELAYED. JumpSTART for paediatric patients (age ≤ 8) adds a pulse check and rescue breath step before vital sign assessment.

### 5.2 Patient Tracking (HICS 254 Equivalent)

The tracking module implements an append-only event log. Each event records the type, valid time, clinician, facility, and any associated triage category change. The full event type set is: `TAGGED → ARRIVED_CCP → LOADED_TRANSPORT → ARRIVED_FACILITY → IN_RESUSCITATION → TO_IMAGING → TO_OR → TO_ICU → TO_WARD → DISCHARGED / TRANSFERRED / DECEASED`.

### 5.3 OR / Surgical Queue

The OR module enforces a strict 11-state machine. Transitions are validated server-side; invalid transitions are rejected with a `BAD_REQUEST` error. Each case carries a `priority` score (1–100), a `isDamageControl` flag, and blood product tracking fields (`mtpActivated`, `rbcUnitsUsed`, `ffpUnitsUsed`, `plateletsUsed`).

---

## 6. Database Schema Reference

The complete schema is defined in `drizzle/schema.ts`. Key design decisions:

- MySQL enums for all categorical fields (triage categories, incident types, OR statuses) enforce data integrity at the database level
- `timestamp` columns with `defaultNow()` and `onUpdateNow()` provide automatic audit trails
- Foreign key relationships are enforced at the application layer to support future distributed deployment
- The `incidentId` column on all operational tables serves as the primary partitioning key
- `passwordHash`, `passwordResetToken`, and `passwordResetExpiry` columns on `users` support the custom auth system; they are excluded from all API responses via destructuring

---

## 7. Triage Algorithm Implementation

The SALT algorithm is implemented as a pure function cross-validated against published reference cases:

```typescript
function runSALT(input: SALTInput): TriageCategory {
  if (input.canWalk) return "MINIMAL";
  if (input.hasLifeThreat && !input.lsiPossible) return "EXPECTANT";
  const abnormalRR = input.respiratoryRate > 30 || input.respiratoryRate < 10;
  if (abnormalRR || !input.pulsePresent || !input.followsCommands) return "IMMEDIATE";
  return "DELAYED";
}
```

All 9 canonical SALT test cases pass with 100% accuracy.

---

## 8. OR Case State Machine

```typescript
const validTransitions: Record<string, string[]> = {
  PROPOSED:   ["SCHEDULED", "CANCELLED"],
  SCHEDULED:  ["IN_OR_PREP", "CANCELLED"],
  IN_OR_PREP: ["INDUCTION", "ABORTED"],
  INDUCTION:  ["INCISION", "ABORTED"],
  INCISION:   ["CLOSURE", "ABORTED"],
  CLOSURE:    ["IN_PACU"],
  IN_PACU:    ["OUT_PACU"],
  OUT_PACU:   ["COMPLETE"],
  COMPLETE: [], CANCELLED: [], ABORTED: [],
};
```

Terminal states have empty transition arrays. Any attempt to transition to an unlisted state results in a `BAD_REQUEST` TRPCError.

---

## 9. Invite & Access Request Flow

### Invite Flow (with Custom Auth)

```
Admin creates invite
      │
      ▼
Token (48-char nanoid) → stored in `invitations` table
      │
      ▼
Invite URL: {origin}/invite/{token}
      │
      ▼
Recipient opens URL → RegisterPage renders role preview + password form
      │
      ▼
User sets password → customAuth.register validates token, hashes password,
                     creates/updates user record, marks invite ACCEPTED,
                     issues JWT session cookie
      │
      ▼
Redirected to /dashboard
```

### Password Reset Flow

```
User submits /forgot-password
      │
      ▼
Server generates 48-char token, stores on user record (1h expiry)
Logs full reset URL to `password_reset_requests` table
Sends in-app notification to platform owner
      │
      ▼
Admin sees reset URL in notification or Admin → Password Resets
Admin forwards URL to user
      │
      ▼
User opens /reset-password?token=... → sets new password → signed in
```

---

## 10. Demo Mode Architecture

The demo mode at `/demo` provides a fully interactive, read-only showcase of all 11 modules without requiring authentication.

**Backend:** A dedicated `demoRouter` in `server/routers/demo.ts` exposes public read-only procedures for all data types. No mutations are exposed through the demo router. All procedures use `publicProcedure` (no auth check).

**Frontend:** A `DemoLayout` component provides the sidebar navigation with a yellow DEMO banner. All demo pages (`client/src/pages/demo/DemoPages.tsx`) call `trpc.demo.*` procedures exclusively. The demo landing page at `/demo` provides a module grid and sample data summary.

**Data:** The demo reads from the same database as the live platform, using the pre-loaded sample data (3 incidents, 43 casualties, 9 OR cases, etc.). This ensures the demo always reflects the current state of the sample data.

**Security:** The demo router is strictly read-only. No write operations are possible through the demo interface. Sensitive fields (passwordHash, passwordResetToken) are never included in demo responses.

---

## 11. Internationalisation

The platform supports English and Arabic through a custom `LanguageContext`. The context provides a `t(key)` translation function, a `lang` state, and a `dir` value (`"ltr"` | `"rtl"`). Language preference is persisted in `localStorage` and applied to `document.documentElement.lang` and `dir` on every change. Arabic text uses the **Cairo** font family; English uses **Inter**.

---

## 12. Testing Strategy

The test suite uses **Vitest** and is located in `server/*.test.ts`. All tests are pure unit tests with no database dependencies.

| Test File | Tests | Coverage |
|---|---|---|
| `auth.logout.test.ts` | 1 | Session cookie clearing |
| `triage.test.ts` | 21 | SALT algorithm (9 cases), OR state machine (11 cases), provisional ID generation |
| `routers.test.ts` | 22 | OR transitions, admin role guard, incident code generation, triage category validation |
| `invitations.test.ts` | 17 | Token generation, expiry logic, claim validation, admin guard |
| **Total** | **61** | |

Run with `pnpm test`. All tests must pass before any deployment.

---

## 13. Performance Characteristics

| Operation | Target p50 | Target p99 |
|---|---|---|
| Dashboard tile load | < 250 ms | < 1 s |
| Casualty list (100 records) | < 150 ms | < 500 ms |
| Triage assessment write | < 100 ms | < 400 ms |
| OR state transition | < 100 ms | < 400 ms |
| Login (bcrypt verify) | < 300 ms | < 800 ms |
| Invite claim (bcrypt hash) | < 400 ms | < 1 s |

bcrypt at cost factor 12 adds approximately 250ms to login and registration operations. This is intentional — it makes brute-force attacks impractical.

---

## 14. Security Considerations

**Password security.** Passwords are hashed with bcrypt (cost factor 12). The plaintext is never stored, logged, or transmitted after the initial hash. The `passwordHash` field is excluded from all API responses via destructuring in the `customAuth` router.

**Session security.** Session cookies are HTTP-only, Secure (HTTPS only), and SameSite=None. Cookies are signed with `JWT_SECRET` using HS256. Sessions expire after 7 days.

**Input validation.** All tRPC procedure inputs are validated with Zod schemas. String length limits, enum constraints, and numeric ranges are enforced at the API boundary.

**Role enforcement.** Every protected procedure checks `ctx.user.role` before executing. Admin-only operations use the `adminProcedure` wrapper or inline role checks.

**Audit logging.** The `audit_logs` table records every significant action with user ID, email, action type, resource type and ID, incident context, and IP address. Audit logs are append-only.

**Data minimisation.** The Public Family Reunification Portal exposes only the casualty's disposition status and never exposes names, injuries, or other PHI. The demo router never exposes sensitive fields.

**Invite token security.** Invite tokens are 48-character cryptographically random strings. They expire after 7 days and are single-use (invalidated on acceptance or revocation).

**Password reset security.** Reset tokens are 48-character cryptographically random strings with a 1-hour expiry. They are invalidated immediately upon use. The `forgotPassword` endpoint always returns success to prevent email enumeration.

**Self-deletion protection.** The `deleteUser` procedure rejects attempts to delete the currently authenticated user's own account.

---

## 15. Deployment Topologies

### Cloud-Primary (Manus Hosting)

The recommended deployment for most organisations. Manus provides managed MySQL, object storage, OAuth, CDN, and SSL with zero infrastructure management. Suitable for regional command centres and multi-facility coordination.

### Hospital On-Premises

For hospitals with data-residency requirements, the platform can be deployed on a hospital's own infrastructure using Docker or Kubernetes. A `k3s` single-node deployment is sufficient for a facility-level instance.

### Tactical Edge (Future)

A planned v3 capability will support a minimal single-node deployment on ARM devices for ambulance and field tent use, with offline-first operation and delta sync when connectivity is restored.

---

## 16. Roadmap

| Phase | Scope | Status |
|---|---|---|
| **v1 (current)** | All 11 modules, bilingual EN/AR, custom email/password auth, invite-only access, demo mode, full admin panel, 61 unit tests | Complete |
| **v2** | Email delivery integration (Resend/SendGrid/SMTP), WebSocket real-time push, FHIR R4/R5 bulk export, barcode/NFC tag scanning, voice input for triage | Planned |
| **v3** | Offline-first PWA service worker, tactical edge deployment, full Arabic translation coverage | Planned |
| **v4** | EHR integration (SMART-on-FHIR launch), national health authority reporting gateway, biometric identity reconciliation | Planned |

---

## 17. References

[^1]: HL7 International. *FHIR R5 — Encounter, Observation, Patient, Procedure.* https://build.fhir.org

[^2]: Lerner EB, Schwartz RB, Coule PL, et al. *Mass Casualty Triage: An Evaluation of the Data and Development of a Proposed National Guideline.* Disaster Medicine and Public Health Preparedness. 2008. https://chemm.hhs.gov/salt.htm

[^3]: ASPR TRACIE. *Disaster Victim/Patient Tracking Form (HICS 254).* https://asprtracie.hhs.gov

[^4]: California Hospital Association. *Hospital Incident Command System (HICS).* https://calhospital.org/hics

[^5]: ASPR TRACIE. *Hospital Mass Casualty Response Plan Considerations and CO-S-TR Model.* https://asprtracie.hhs.gov

[^6]: WHO Kobe Centre. *Health Data Collection Tools (EMT MDS).* https://wkc.who.int

[^7]: OWASP. *Password Storage Cheat Sheet.* https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
