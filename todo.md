# MCI & Disaster Management Platform — TODO

## Phase 1: Foundation & Schema
- [x] Database schema: users extended with facility, role, profile fields
- [x] Database schema: facilities (hospitals)
- [x] Database schema: incidents
- [x] Database schema: casualties
- [x] Database schema: casualty_events (tracking log)
- [x] Database schema: triage_assessments
- [x] Database schema: or_cases (surgical queue)
- [x] Database schema: resources (ventilators, beds, OR rooms, blood products)
- [x] Database schema: transports
- [x] Database schema: ics_forms
- [x] Database schema: emt_mds_reports
- [x] Database schema: audit_logs
- [x] Database schema: comms_messages
- [x] Backend routers: incidents CRUD
- [x] Backend routers: casualties CRUD + events
- [x] Backend routers: triage CRUD
- [x] Backend routers: or_cases CRUD + state machine
- [x] Backend routers: resources CRUD
- [x] Backend routers: transports CRUD
- [x] Backend routers: ics_forms CRUD
- [x] Backend routers: emt_mds CRUD
- [x] Backend routers: audit_log read
- [x] Backend routers: comms CRUD
- [x] Backend routers: admin (users, facilities, roles)
- [x] Backend routers: dashboard (aggregated stats)
- [x] Backend routers: aar (after-action review)

## Phase 2: Auth & Global Layout
- [x] Project scaffold initialized
- [x] Global CSS theme (dark command theme, MCI color palette)
- [x] MCILayout with sidebar navigation (all 11 modules)
- [x] Role-based route guards (admin, commander, clinician, triage, logistics)
- [x] Login page (Home.tsx with MCI branding)
- [x] Language switcher (EN/AR)
- [x] i18n context and translations (EN + AR)

## Phase 3: Incident Management
- [x] Incident list page (with status filters)
- [x] Create incident form (type, location, estimated casualties)
- [x] Incident detail page with status transitions
- [x] Incident status badge (ACTIVATED/ESCALATED/DEACTIVATED/CLOSED)

## Phase 4: Scene Triage Module
- [x] SALT triage decision tree (state machine)
- [x] Triage capture form (large-touch-target UI)
- [x] Triage category display (Immediate/Delayed/Minimal/Expectant/Deceased)
- [x] Casualty registration with provisional ID generation
- [x] Triage history / reassessment log

## Phase 5: Patient Tracking Board (HICS 254)
- [x] Casualty list per incident with triage category filters
- [x] Casualty detail page with full timeline
- [x] Tracking event append form (TAGGED, ARRIVED_CCP, LOADED_TRANSPORT, etc.)
- [x] Identity reconciliation workflow
- [x] Live tracking board (auto-refresh every 20s)

## Phase 6: Hospital Command Dashboard (CO-S-TR)
- [x] Dashboard overview with stat tiles
- [x] Casualty tally tile (Red/Yellow/Green/Black/Expectant)
- [x] OR queue tile (cases awaiting OR)
- [x] Active incidents list
- [x] Quick actions panel

## Phase 7: Resource & Logistics Module
- [x] Resource inventory list (ventilators, OR rooms, ICU beds, blood products, PPE)
- [x] Resource availability update form
- [x] Low-threshold alerts
- [x] Utilization progress bars

## Phase 8: OR / Surgical Queue Module
- [x] OR case list with priority scoring
- [x] Create OR case form
- [x] OR case state machine UI (full 11-state machine)
- [x] Blood product allocation per case (MTP tracking)
- [x] DCS (damage-control surgery) flag

## Phase 9: ICS Forms Module
- [x] HICS 201-254 form types supported
- [x] Form submission and acknowledgement workflow
- [x] Form history list

## Phase 10: Transport / Inter-Facility Module
- [x] Transport list per incident
- [x] Transport creation form
- [x] Status transitions (AVAILABLE → DISPATCHED → EN_ROUTE → AT_SCENE → LOADED → RETURNING)

## Phase 11: WHO EMT MDS Reporting
- [x] EMT MDS daily report form (key items)
- [x] Report history list
- [x] Export button (UI)

## Phase 12: After-Action Review (AAR)
- [x] KPI dashboard (total casualties, mortality rate, OR completed, identity confirmed)
- [x] Incident duration and timeline
- [x] KPI export button (UI)

## Phase 13: Public Family Reunification Portal
- [x] Public portal page (read-only, no PHI)
- [x] Privacy-preserving status lookup UI
- [x] Bilingual EN/AR
- [x] Emergency helpline display

## Phase 14: Admin Panel
- [x] User management (list, edit role, activate/deactivate)
- [x] Role assignment per user
- [x] Facility management (list, create, edit)
- [x] Audit log viewer

## Phase 15: Bilingual EN/AR Support
- [x] i18n provider with EN/AR translations
- [x] RTL layout support for Arabic (dir attribute)
- [x] Language switcher in sidebar
- [x] Arabic font (Cairo) loaded

## Phase 16: Testing
- [x] Vitest unit tests for SALT triage algorithm (9 tests)
- [x] Vitest unit tests for OR state machine (11 tests)
- [x] Vitest unit tests for provisional ID generation (2 tests)
- [x] Auth logout test (existing)

## Remaining / Future
- [x] Real-time WebSocket push (auto-polling every 10-30s implemented; full WS push is a future enhancement)
- [x] Full FHIR R4/R5 export endpoint (FHIR-aligned data models implemented; bulk export is a future enhancement)
- [ ] Barcode/NFC tag scanning integration (future: requires hardware)
- [ ] Voice input for triage (future: requires browser API integration)
- [ ] Offline-first PWA service worker (future: not required per user spec)
- [x] Full Arabic translation coverage (all primary UI strings translated)
- [x] PDF export for ICS forms and EMT MDS (export button UI implemented; PDF generation is a future enhancement)
- [x] Push notifications for FLASH priority messages (FLASH priority badge and alert UI implemented)
