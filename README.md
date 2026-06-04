# Saud's MCI & Disaster Management Platform

> **A comprehensive, web-based Mass Casualty Incident (MCI) and Disaster Management Platform for the Kuwait Ministry of Health and hospital networks.**

Built and designed by **Saud Naji Alzaid**, this platform supports the full chain of survival — from scene triage through definitive surgical care, inter-facility coordination, and after-action review — aligned with internationally recognised standards including SALT, HICS, CO-S-TR, WHO EMT MDS, and HL7 FHIR R4/R5.

---

## Table of Contents

1. [Overview](#overview)
2. [Platform Modules](#platform-modules)
3. [Technology Stack](#technology-stack)
4. [Quick Start (Local Development)](#quick-start-local-development)
5. [Deployment & Hosting](#deployment--hosting)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [User Access & Invitations](#user-access--invitations)
9. [Role Reference](#role-reference)
10. [Standards Compliance](#standards-compliance)
11. [License](#license)
12. [Credits & Acknowledgements](#credits--acknowledgements)

---

## Overview

Saud's MCI Platform is a full-stack web application that provides real-time situational awareness and operational coordination during mass casualty incidents and disasters. It is designed for use by hospital incident command teams, emergency physicians, triage officers, logistics coordinators, and Ministry of Health oversight personnel.

The platform is **invite-only** by design — access is controlled exclusively by administrators who issue time-limited invitation links. Uninvited hospital staff may submit a Request Access form from the landing page, which notifies the administrator for review.

---

## Platform Modules

| Module | Description |
|---|---|
| **Scene Triage** | SALT, START, and JumpSTART (paediatric) decision trees with guided casualty registration |
| **Patient Tracking** | HICS 254-equivalent immutable event log from scene to discharge |
| **Hospital Command Dashboard** | CO-S-TR tiles: triage tally, OR queue, blood bank, ventilators, ICU census |
| **Incident Management** | Full incident lifecycle (ACTIVATED → ESCALATED → DEACTIVATED → CLOSED) |
| **OR / Surgical Queue** | 11-state surgical case machine with damage-control surgery flag and MTP tracking |
| **Resources & Logistics** | Real-time inventory for ventilators, ICU/OR beds, blood products, PPE, medications |
| **Transport** | Inter-facility transport manifests and status tracking |
| **ICS Forms** | HICS 201, 202, 203, 204, 205A, 213, 214, and 254 form submission and acknowledgement |
| **WHO EMT MDS** | 85-item Emergency Medical Team Minimum Data Set daily reporting |
| **Communications** | Incident-scoped messaging by channel (Command, Operations, Logistics, Medical) and priority |
| **After-Action Review** | KPI dashboard with mortality rate, OR throughput, identity confirmation rate |
| **Public Family Reunification Portal** | Privacy-preserving status lookup for family members (no PHI exposed) |
| **Admin Panel** | User management, invitations, access request review, facility management, audit log |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Wouter, Recharts |
| **Backend** | Node.js, Express 4, tRPC 11 (end-to-end type safety) |
| **Database** | MySQL / TiDB (via Drizzle ORM) |
| **Authentication** | Manus OAuth 2.0 (OpenID Connect) |
| **Real-time** | Auto-polling with configurable intervals (10–30 s per module) |
| **Internationalisation** | Custom i18n context — English and Arabic (RTL) |
| **Testing** | Vitest — 61 unit tests covering triage algorithms, OR state machine, role guards |
| **Build** | Vite 7, esbuild, pnpm |

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js** ≥ 22 and **pnpm** ≥ 10
- A **MySQL 8** (or TiDB) database
- A **Manus** account for OAuth (or configure a compatible OIDC provider)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/mci-platform.git
cd mci-platform

# 2. Install dependencies
pnpm install

# 3. Copy the environment template and fill in your values
cp .env.example .env

# 4. Push the database schema
pnpm drizzle-kit generate
# Then apply the generated SQL to your database

# 5. Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Running Tests

```bash
pnpm test
```

All 61 tests should pass. The test suite covers the SALT triage algorithm, OR case state machine, role-based access guards, invite flow logic, and resource utilisation calculations.

---

## Deployment & Hosting

### Hosted on Manus (Recommended)

This platform is designed to run on [Manus](https://manus.im) with zero-configuration deployment. After making changes:

1. Ensure all tests pass: `pnpm test`
2. Create a checkpoint from the Management UI or via the platform tools
3. Click the **Publish** button in the Manus Management UI header

Manus provides built-in hosting with custom domain support, automatic SSL, a managed MySQL database, and OAuth integration. No additional infrastructure is required.

### Self-Hosted Deployment

For on-premises or cloud deployments (e.g., Kuwait MoH data-residency requirements):

#### Option A — Docker (Recommended for self-hosting)

```bash
# Build the production image
docker build -t mci-platform:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/mci" \
  -e JWT_SECRET="your-secret-here" \
  -e VITE_APP_ID="your-oauth-app-id" \
  -e OAUTH_SERVER_URL="https://your-oauth-server" \
  mci-platform:latest
```

#### Option B — Manual Node.js

```bash
# Build for production
pnpm build

# Start the production server
NODE_ENV=production node dist/index.js
```

#### Option C — Kubernetes / k3s (Hospital cluster)

A `k8s/` directory with Helm charts and deployment manifests is available for hospital-grade deployments. Refer to the [Technical Documentation](./docs/TECHNICAL.md) for the full Kubernetes deployment guide.

### Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name mci.your-hospital.gov.kw;

    ssl_certificate     /etc/ssl/certs/mci.crt;
    ssl_certificate_key /etc/ssl/private/mci.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string: `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Yes | Secret key for session cookie signing (min 32 chars) |
| `VITE_APP_ID` | Yes | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Yes | Manus login portal URL (frontend) |
| `BUILT_IN_FORGE_API_KEY` | Yes | Manus built-in API bearer token (server-side) |
| `BUILT_IN_FORGE_API_URL` | Yes | Manus built-in API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Yes | Frontend access token for Manus APIs |
| `VITE_FRONTEND_FORGE_API_URL` | Yes | Frontend Manus API URL |
| `OWNER_OPEN_ID` | Yes | OpenID of the platform owner (auto-assigned superadmin) |
| `OWNER_NAME` | No | Display name of the platform owner |

> **Security note:** Never commit `.env` files to version control. Use a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) in production deployments.

---

## Database Setup

The platform uses **Drizzle ORM** with MySQL. The schema defines 15 tables:

`users`, `facilities`, `incidents`, `casualties`, `casualty_events`, `triage_assessments`, `or_cases`, `resources`, `transports`, `ics_forms`, `emt_mds_reports`, `comms_messages`, `audit_logs`, `invitations`, `access_requests`

To apply the schema to a fresh database:

```bash
# Generate migration SQL from the schema
pnpm drizzle-kit generate

# Review the generated SQL in drizzle/
# Then apply it to your database using your preferred MySQL client or:
pnpm drizzle-kit migrate
```

For schema changes, always follow the **expand/contract pattern** — add new columns before removing old ones to maintain backward compatibility during rolling deployments.

---

## User Access & Invitations

This platform uses an **invite-only access model**. There is no public registration.

### Inviting a New User

1. Sign in as an **Admin** or **Super Admin**
2. Navigate to **Admin → Invitations**
3. Click **Send Invitation**, enter the recipient's email, assign their role and optionally a facility
4. Copy the generated invite link and share it with the recipient
5. The link expires after **7 days**; use **Resend** to extend it

### Handling Access Requests

Hospital staff who do not have an invite can submit a **Request Access** form from the landing page. Submitted requests appear in **Admin → Access Requests** with a badge counter. From there, you can send an invitation directly or reject the request.

### First-Time Login Flow

When a recipient clicks their invite link, they are shown a preview of their assigned role and the name of who invited them. They click **Accept Invitation** and authenticate via Manus OAuth. Their role is applied automatically upon successful authentication.

---

## Role Reference

| Role | Key Permissions |
|---|---|
| **Super Admin** | Full system access; manages all users, facilities, and platform settings |
| **Admin** | User management, invitations, facility management, audit log access |
| **Incident Commander** | Create and manage incidents; access all operational modules |
| **Clinician** | Patient tracking, triage, OR queue, communications |
| **Triage Officer** | Scene triage, casualty registration, triage reassessment |
| **Logistics** | Resources, transport, supply requests, EMT MDS reporting |
| **Viewer** | Read-only access to dashboards and incident boards |

---

## Standards Compliance

| Standard | Application |
|---|---|
| **SALT** | Default adult triage algorithm (CHEMM/HHS) |
| **START** | Alternative adult triage algorithm |
| **JumpSTART** | Paediatric triage algorithm (age ≤ 8) |
| **HICS** | Incident command structure, Job Action Sheets, ICS forms 201–254 |
| **CO-S-TR** | Hospital command dashboard organising principle (ASPR TRACIE) |
| **WHO EMT MDS** | 85-item daily situation report for deployed EMT teams |
| **HL7 FHIR R4/R5** | FHIR-aligned data models for interoperability with national EHRs |
| **NDMS / ESF-8** | Inter-facility patient movement schema |
| **HIPAA / GDPR / Kuwait DPPL** | Data minimisation, audit logging, RBAC, breach response |

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Saud Naji Alzaid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Credits & Acknowledgements

**Platform Owner & Architect:** Saud Naji Alzaid

This platform was designed and built to serve the Kuwait Ministry of Health and its affiliated hospital network. The clinical decision logic, triage algorithms, and operational workflows are based on the following internationally recognised standards and publications:

- ASPR TRACIE — Hospital Mass Casualty Response Plan Considerations and CO-S-TR Model
- California Hospital Association — Hospital Incident Command System (HICS)
- CHEMM/HHS — SALT and JumpSTART Mass Casualty Triage Algorithms
- WHO Kobe Centre — Emergency Medical Team Minimum Data Set
- HL7 International — FHIR R4/R5 Specification
- Utah DHHS — ESF-8 Appendix 1, Federal Emergency Support Function 8

**Built with:** React, TypeScript, tRPC, Drizzle ORM, Tailwind CSS, shadcn/ui, and the Manus platform.

---

*For support, deployment assistance, or to report a security vulnerability, contact the platform administrator.*
