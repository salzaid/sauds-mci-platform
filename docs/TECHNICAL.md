# Saud's MCI Platform — Technical Documentation

**Document version:** 1.0  
**Author:** Saud Naji Alzaid  
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
10. [Internationalisation](#10-internationalisation)
11. [Testing Strategy](#11-testing-strategy)
12. [Performance Characteristics](#12-performance-characteristics)
13. [Security Considerations](#13-security-considerations)
14. [Deployment Topologies](#14-deployment-topologies)
15. [Roadmap](#15-roadmap)
16. [References](#16-references)

---

## 1. System Architecture

Saud's MCI Platform follows a **monolithic full-stack architecture** with a clean separation between client and server, connected via a fully type-safe tRPC API layer. This design was chosen for v1 to maximise development velocity while preserving a clear path to microservice decomposition in future phases.

```
┌─────────────────────────────────────────────────────────┐
│  Client (React 19 + TypeScript + Tailwind CSS 4)        │
│  ┌──────────────┬─────────────────┬───────────────────┐  │
│  │ Dashboard    │ Triage / Track  │ Admin / Forms     │  │
│  └──────┬───────┴────────┬────────┴──────────┬────────┘  │
│         │  tRPC over HTTP│                   │           │
└─────────┼────────────────┼───────────────────┼───────────┘
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│  Server (Node.js + Express 4 + tRPC 11)                 │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │incidents │casualties│ orCases  │ admin / invites   │  │
│  │resources │transports│ icsForms │ dashboard / comms │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Manus OAuth middleware + JWT session cookies    │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Data Tier                                              │
│  • MySQL 8 / TiDB (Drizzle ORM, 15 tables)             │
│  • Manus Object Storage (S3-compatible)                 │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**tRPC over REST** was chosen because it eliminates the need for a separate API contract file, provides compile-time type safety from database row to React component, and reduces the surface area for integration bugs. Every procedure is defined once in `server/routers/` and consumed directly in the frontend via generated hooks.

**Drizzle ORM** was selected over Prisma for its lightweight footprint, explicit SQL generation, and superior TypeScript inference. The schema in `drizzle/schema.ts` is the single source of truth for both the database structure and all TypeScript types used throughout the application.

**Polling over WebSockets** was chosen for v1 real-time updates. Dashboard tiles, the tracking board, and the OR queue refresh automatically on configurable intervals (10–30 seconds). This approach is simpler to deploy and debug than a persistent WebSocket server, and is sufficient for the operational tempo of most MCI scenarios. Full WebSocket push is planned for v2.

---

## 2. Data Model

All clinical entities are modelled to be compatible with HL7 FHIR R4/R5 [^1] resource shapes, enabling future integration with national EHR systems without requiring a schema migration. Non-clinical operational entities (incident command structure, resource inventory) use platform-native models.

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

### Provisional Identity Model

In mass casualty incidents, patient identity is unknown for hours or days. The platform generates a deterministic provisional identifier at first contact using the format `{INCIDENT_CODE}-T{TAG_NUMBER_PADDED}` (e.g., `MCI-2026-ALPHA1-T0042`). This identifier is bound to the physical triage tag serial number and persists as a secondary identifier even after civil identity is confirmed.

Identity reconciliation is performed through the `PATCH /casualties/{id}/identity` endpoint, which requires an authenticated clinician, records the confirming user and timestamp, and appends an `IDENTITY_CONFIRMED` event to the immutable tracking log.

### Bi-Temporal Modelling

Every clinical record carries two timestamps. `validTime` (or `assessedAt`, `incisionAt`, etc.) records when the clinical event occurred in the real world. `createdAt` records when the system learned of it. This distinction is critical for after-action reconstruction, where the sequence of clinical events must be preserved independently of when data was entered.

---

## 3. API Design

The platform exposes a single tRPC router tree at `/api/trpc`. All procedures are strongly typed end-to-end. The router namespace mirrors the domain model:

```
appRouter
├── auth.me
├── auth.logout
├── incidents.list / get / create / updateStatus / getBoard / delete
├── casualties.list / get / create / update / addEvent / getTimeline / getTriageHistory / addTriage / confirmIdentity
├── orCases.list / get / create / transition / updateBloodProducts
├── resources.list / upsert / delete
├── transports.list / create / updateStatus
├── icsForms.list / get / save / acknowledge
├── emtMds.list / get / save
├── comms.list / send / acknowledge
├── admin.listUsers / updateUser / listFacilities / createFacility / updateFacility / listAuditLogs
├── dashboard.overview / incidentDashboard / resourceSummary / aarKpis
├── invitations.list / create / resend / revoke / getByToken / claim
└── system.health / notifyOwner / requestAccess / listAccessRequests / updateAccessRequest
```

### Procedure Access Levels

Three procedure wrappers are defined in `server/_core/trpc.ts`:

- `publicProcedure` — no authentication required (used for `getByToken`, `requestAccess`, health probes)
- `protectedProcedure` — requires a valid session cookie; injects `ctx.user`
- `adminProcedure` — requires `ctx.user.role` to be `superadmin` or `admin`

Role enforcement beyond admin/non-admin is handled inline within each procedure using the `requireAdmin()` helper pattern.

---

## 4. Authentication & Authorisation

### OAuth 2.0 + OpenID Connect

Authentication is delegated to the Manus OAuth server using the **Authorization Code with PKCE** flow. The callback is handled at `/api/oauth/callback`, which exchanges the code for an access token, retrieves the user's profile, upserts the user record in the database, and issues a signed HTTP-only session cookie.

The session cookie is signed with `JWT_SECRET` and carries the user's database `id` and `openId`. On every tRPC request, the `context.ts` middleware verifies the cookie and attaches the full user record to `ctx.user`.

### Invite-Only Access Control

The platform enforces invite-only access at two levels. At the **UI level**, the landing page and all protected route gates display an invite-only message with no sign-in button. At the **server level**, the `claim` procedure validates the invite token, checks expiry and status, and only then applies the role to the user record. A user who authenticates without a valid invite token receives the default `viewer` role.

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

Roles are stored as a MySQL enum on the `users` table and checked inline in each procedure. There is no hierarchical inheritance in the current implementation — each procedure explicitly enumerates the roles it permits.

---

## 5. Module Specifications

### 5.1 Scene Triage Module

The triage module implements the SALT (Sort-Assess-Lifesaving interventions-Treatment/Transport) algorithm [^2] as a client-side state machine. The decision tree is encoded as a sequence of binary questions; each answer advances the state to either a terminal triage category or the next assessment step.

The algorithm proceeds as follows. First, the **Sort** step asks whether the patient can walk to a designated area. Ambulatory patients are immediately categorised as MINIMAL. Non-ambulatory patients proceed to the **Assess** step, which evaluates the presence of obvious life-threatening haemorrhage or airway obstruction. If a life threat is present and a lifesaving intervention (tourniquet, airway opening, needle decompression) is not feasible, the patient is categorised as EXPECTANT. If an intervention is feasible, it is performed and the patient proceeds to vital sign assessment. Abnormal respiratory rate (< 10 or > 30/min), absent pulse, or inability to follow commands results in IMMEDIATE categorisation. Patients with normal vitals are categorised as DELAYED.

Every triage assessment is stored as a new row in `triage_assessments`. Reassessments are never mutations of prior records — they are always new immutable observations, preserving the full assessment history for after-action review.

### 5.2 Patient Tracking (HICS 254 Equivalent)

The tracking module implements an append-only event log modelled on the HICS 254 Disaster Victim/Patient Tracking Form [^3]. Each event records the type, valid time, clinician, facility, and any associated triage category change. The full set of trackable event types is:

`TAGGED → ARRIVED_CCP → LOADED_TRANSPORT → ARRIVED_FACILITY → IN_RESUSCITATION → TO_IMAGING → TO_OR → TO_ICU → TO_WARD → DISCHARGED / TRANSFERRED / DECEASED`

The casualty's `disposition` field is updated as a side effect of event creation to reflect the current location in the care pathway.

### 5.3 OR / Surgical Queue

The OR module enforces a strict state machine with 11 states. Transitions are validated server-side; invalid transitions are rejected with a `BAD_REQUEST` error. The valid transition graph is:

```
PROPOSED → SCHEDULED → IN_OR_PREP → INDUCTION → INCISION → CLOSURE → IN_PACU → OUT_PACU → COMPLETE
    ↘ CANCELLED          ↘ CANCELLED    ↘ ABORTED     ↘ ABORTED    ↘ ABORTED
```

Each case carries a `priority` score (1–100), a `isDamageControl` flag for abbreviated damage-control surgery, and blood product tracking fields (`mtpActivated`, `rbcUnitsUsed`, `ffpUnitsUsed`, `plateletsUsed`) aligned with the 1:1:1 Massive Transfusion Protocol ratio.

---

## 6. Database Schema Reference

The complete schema is defined in `drizzle/schema.ts`. Key design decisions include the use of MySQL enums for all categorical fields (triage categories, incident types, OR statuses) to enforce data integrity at the database level, and the use of `timestamp` columns with `defaultNow()` and `onUpdateNow()` for automatic audit trails.

All foreign key relationships are enforced at the application layer rather than the database layer to support the eventual migration to a distributed or partitioned data tier. The `incidentId` column on all operational tables serves as the primary partitioning key.

---

## 7. Triage Algorithm Implementation

The SALT algorithm is implemented as a pure function in both the server test suite (`server/triage.test.ts`) and the client-side triage page state machine. The reference implementation used for validation is:

```typescript
function runSALT(input: SALTInput): TriageCategory {
  if (input.canWalk) return "MINIMAL";
  if (input.hasLifeThreat && !input.lsiPossible) return "EXPECTANT";
  const abnormalRR = input.respiratoryRate > 30 || input.respiratoryRate < 10;
  if (abnormalRR || !input.pulsePresent || !input.followsCommands) return "IMMEDIATE";
  return "DELAYED";
}
```

This function is cross-validated against the published SALT reference cases [^2] in the test suite. All 9 canonical test cases pass with 100% accuracy.

---

## 8. OR Case State Machine

The state machine is enforced by the `validTransitions` map in `server/routers/orCases.ts`. Any attempt to transition to a state not listed as a valid successor results in a `BAD_REQUEST` TRPCError with a descriptive message. Terminal states (`COMPLETE`, `CANCELLED`, `ABORTED`) have empty transition arrays, making them truly terminal.

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

---

## 9. Invite & Access Request Flow

### Invite Flow

```
Admin creates invite
      │
      ▼
Token (48-char nanoid) generated → stored in `invitations` table
      │
      ▼
Invite URL: {origin}/invite/{token}
      │
      ▼
Recipient opens URL → InvitePage renders role preview
      │
      ├─ Not authenticated → stores token in sessionStorage → redirects to OAuth
      │         └─ After OAuth callback → auto-claims token → role applied
      │
      └─ Already authenticated → clicks Accept → claim mutation → role applied
```

### Access Request Flow

```
Visitor submits Request Access form (public endpoint)
      │
      ▼
Row inserted in `access_requests` table
      │
      ▼
notifyOwner() sends in-app notification to platform owner
      │
      ▼
Admin reviews in Admin → Access Requests tab
      │
      ├─ Send Invite → opens invitation dialog pre-filled with email
      │                → marks request as INVITED
      └─ Reject → marks request as REJECTED
```

---

## 10. Internationalisation

The platform supports English and Arabic through a custom `LanguageContext` in `client/src/contexts/LanguageContext.tsx`. The context provides a `t(key)` translation function, a `lang` state (`"en"` | `"ar"`), and a `dir` value (`"ltr"` | `"rtl"`).

Language preference is persisted in `localStorage` and applied to the `document.documentElement.lang` and `dir` attributes on every change, which triggers the browser's native RTL layout engine for all CSS flexbox and grid elements. Arabic text uses the **Cairo** font family (loaded from Google Fonts) while English uses **Inter**.

The translation dictionary covers all navigation labels, triage category names, incident status labels, OR status labels, role names, and common UI strings. Hardcoded English strings remain in a small number of complex form components and are marked for completion in v2.

---

## 11. Testing Strategy

The test suite uses **Vitest** and is located in `server/*.test.ts`. Tests are pure unit tests with no database dependencies — all database calls are mocked via `vi.mock("./db")`.

| Test File | Tests | Coverage |
|---|---|---|
| `auth.logout.test.ts` | 1 | Session cookie clearing |
| `triage.test.ts` | 21 | SALT algorithm (9 cases), OR state machine (11 cases), provisional ID generation (2 cases) |
| `routers.test.ts` | 22 | OR transitions, admin role guard, incident code generation, triage category validation, resource utilisation |
| `invitations.test.ts` | 17 | Token generation, expiry logic, claim validation, admin guard |
| **Total** | **61** | |

All tests must pass before any deployment. Run with `pnpm test`.

---

## 12. Performance Characteristics

The platform is designed for the operational tempo of a mass casualty incident, not for high-frequency trading or social media scale. The following performance targets apply:

| Operation | Target p50 | Target p99 |
|---|---|---|
| Dashboard tile load | < 250 ms | < 1 s |
| Casualty list (100 records) | < 150 ms | < 500 ms |
| Triage assessment write | < 100 ms | < 400 ms |
| OR state transition | < 100 ms | < 400 ms |
| Invite claim | < 200 ms | < 800 ms |

Auto-refresh intervals are set conservatively (10–30 seconds) to avoid database overload during high-casualty incidents. These can be tuned in each page component's `refetchInterval` option.

---

## 13. Security Considerations

**Session security.** Session cookies are HTTP-only, Secure (HTTPS only), and SameSite=None to support cross-origin OAuth flows. Cookies are signed with `JWT_SECRET` using the `jose` library.

**Input validation.** All tRPC procedure inputs are validated with Zod schemas before reaching business logic. String length limits, enum constraints, and numeric ranges are enforced at the API boundary.

**Role enforcement.** Every protected procedure checks `ctx.user.role` before executing. Admin-only operations use the `adminProcedure` wrapper or the inline `requireAdmin()` helper.

**Audit logging.** The `audit_logs` table records every significant action with the user ID, email, action type, resource type and ID, incident context, and IP address. Audit logs are append-only and are never deleted.

**Data minimisation.** The Public Family Reunification Portal exposes only the casualty's disposition status (e.g., "Receiving Treatment") and never exposes names, injuries, or other PHI.

**Invite token security.** Invite tokens are 48-character cryptographically random strings generated by `nanoid`. Tokens expire after 7 days and are invalidated immediately upon acceptance or revocation.

---

## 14. Deployment Topologies

### Cloud-Primary (Manus Hosting)

The recommended deployment for most organisations. Manus provides managed MySQL, object storage, OAuth, CDN, and SSL with zero infrastructure management. Suitable for regional command centres and multi-facility coordination.

### Hospital On-Premises

For hospitals with data-residency requirements (e.g., Kuwait DPPL mandates in-country data storage), the platform can be deployed on a hospital's own infrastructure using Docker or Kubernetes. A `k3s` single-node deployment is sufficient for a facility-level instance.

### Tactical Edge (Future)

A planned v3 capability will support a minimal single-node deployment on ARM devices (Raspberry Pi CM4, NVIDIA Jetson) for ambulance and field tent use, with offline-first operation and delta sync when connectivity is restored.

---

## 15. Roadmap

| Phase | Scope | Status |
|---|---|---|
| **v1 (current)** | All 11 modules, bilingual EN/AR, invite-only access, 61 unit tests | Complete |
| **v2** | WebSocket real-time push, FHIR R4/R5 bulk export, barcode/NFC tag scanning, voice input for triage | Planned |
| **v3** | Offline-first PWA service worker, tactical edge deployment, full Arabic translation coverage | Planned |
| **v4** | EHR integration (SMART-on-FHIR launch), national health authority reporting gateway, biometric identity reconciliation | Planned |

---

## 16. References

[^1]: HL7 International. *FHIR R5 — Encounter, Observation, Patient, Procedure.* https://build.fhir.org

[^2]: Lerner EB, Schwartz RB, Coule PL, et al. *Mass Casualty Triage: An Evaluation of the Data and Development of a Proposed National Guideline.* Disaster Medicine and Public Health Preparedness. 2008. https://chemm.hhs.gov/salt.htm

[^3]: ASPR TRACIE. *Disaster Victim/Patient Tracking Form (HICS 254).* https://asprtracie.hhs.gov

[^4]: California Hospital Association. *Hospital Incident Command System (HICS).* https://calhospital.org/hics

[^5]: ASPR TRACIE. *Hospital Mass Casualty Response Plan Considerations and CO-S-TR Model.* https://asprtracie.hhs.gov

[^6]: WHO Kobe Centre. *Health Data Collection Tools (EMT MDS).* https://wkc.who.int

[^7]: Utah DHHS. *ESF-8 Appendix 1 — Federal Emergency Support Function 8.* https://dhhs.utah.gov
