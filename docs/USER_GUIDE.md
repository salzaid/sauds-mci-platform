# Saud's MCI Platform — End-User Guide

**For Medical and Healthcare Personnel**

**Platform:** Saud's MCI & Disaster Management Platform  
**Version:** 1.1  
**Author:** Saud Naji Alzaid  
**Audience:** Emergency physicians, triage officers, nurses, surgeons, logistics coordinators, incident commanders

---

> **Important Notice:** This platform is a coordination and documentation tool. It does not replace clinical judgement, established hospital protocols, or direct communication between care providers. In all cases, the safety of patients and staff takes precedence over data entry.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigating the Platform](#2-navigating-the-platform)
3. [Scene Triage Module](#3-scene-triage-module)
4. [Patient Tracking Board](#4-patient-tracking-board)
5. [Hospital Command Dashboard](#5-hospital-command-dashboard)
6. [OR / Surgical Queue](#6-or--surgical-queue)
7. [Resources & Logistics](#7-resources--logistics)
8. [Transport Management](#8-transport-management)
9. [ICS Forms](#9-ics-forms)
10. [Communications](#10-communications)
11. [WHO EMT MDS Reporting](#11-who-emt-mds-reporting)
12. [After-Action Review](#12-after-action-review)
13. [Family Reunification Portal](#13-family-reunification-portal)
14. [Admin Panel](#14-admin-panel)
15. [Frequently Asked Questions](#15-frequently-asked-questions)
16. [Quick Reference Card](#16-quick-reference-card)

---

## 1. Getting Started

### Accessing the Platform

Access to Saud's MCI Platform is **invite-only**. You will receive a personalised invitation link from your hospital administrator or incident commander. The link looks like this:

```
https://mci.your-hospital.example/invite/AbCdEfGh...
```

When you open the link, you will see a page showing your assigned role and the name of the person who invited you. You will be asked to create a password for your account. Enter a password of at least 8 characters, confirm it, and click **Create Account & Sign In**. You will be taken to the dashboard immediately.

> **Invitation links expire after 7 days.** If your link has expired, contact your administrator to request a new one.

### Signing In

Once your account is created, you can sign in at any time by going to the platform's main page and clicking **Sign In**, or by navigating directly to `/login`. Enter your email address and the password you set when you accepted your invitation.

### Forgot Your Password?

Click **Forgot password?** on the sign-in page and enter your email address. Your administrator will receive a notification with a reset link, which they will forward to you. Open the link, set a new password, and you will be signed in automatically.

### Requesting Access

If you have not received an invitation, visit the platform's main page and click **Request Access**. Fill in your name, email address, job title, hospital, and a brief description of why you need access. Your administrator will be notified and will send you an invitation if approved.

### Your Role

Your role determines which modules you can access and what actions you can perform.

| Role | Typical Staff | Key Capabilities |
|---|---|---|
| **Incident Commander** | Medical director, ED chief | Declare incidents, access all modules, manage ICS forms |
| **Clinician** | Emergency physician, surgeon, nurse | Triage, patient tracking, OR queue, communications |
| **Triage Officer** | Paramedic, triage nurse | Scene triage, casualty registration |
| **Logistics** | Logistics coordinator, supply officer | Resources, transport, EMT MDS reporting |
| **Viewer** | Observers, trainees | Read-only access to dashboards |

### Changing Your Password

After signing in, click your name in the bottom-left corner of the sidebar and select **Change Password**. Enter your current password, then your new password twice, and click **Change Password**.

### Language

The platform supports both **English** and **Arabic (RTL)**. Click your name in the bottom-left corner of the sidebar and select the language toggle. Your preference is saved automatically.

---

## 2. Navigating the Platform

After signing in, you will see the **Command Dashboard** — a real-time overview of all active incidents. The left sidebar provides access to all modules. On mobile devices, tap the menu icon (☰) in the top-left corner to open the navigation.

The sidebar is organised as follows:

| Section | Modules |
|---|---|
| **Operations** | Dashboard, Incidents, Triage, Patient Tracking |
| **Clinical** | OR Queue, Resources, Transport |
| **Command** | ICS Forms, EMT MDS, After-Action Review, Communications |
| **Public** | Family Reunification Portal |
| **Administration** | Admin Panel (admin roles only) |

The platform refreshes automatically every 10–30 seconds depending on the module. You do not need to manually reload the page during an incident.

---

## 3. Scene Triage Module

The Scene Triage module guides you through the **SALT** (Sort-Assess-Lifesaving interventions-Treatment/Transport) triage algorithm and records each casualty's assessment in real time.

### Selecting an Incident

Before registering casualties, select the active incident from the dropdown at the top of the Triage page. If no incident is listed, it must first be declared in the **Incidents** module by an Incident Commander or Admin.

### Registering a New Casualty

Click **Register Casualty** to open the registration form. Enter the physical triage tag serial number (if available), the patient's estimated age, sex, and GPS coordinates if your device provides them. Click **Register & Start SALT Triage** to proceed immediately to the guided triage assessment.

### Completing the SALT Assessment

The SALT assessment presents one question at a time with large YES / NO buttons designed for use with gloves or in low-light conditions.

**Step 1 — Sort:** "Can the patient walk to a designated area?" YES → MINIMAL. NO → proceed.

**Step 2 — Life Threat:** "Does the patient have obvious life-threatening haemorrhage or airway obstruction?" YES and intervention not feasible → EXPECTANT. YES and intervention feasible → perform intervention and proceed.

**Step 3 — Vital Signs:** "Is the respiratory rate abnormal (< 10 or > 30/min), pulse absent, or does the patient fail to follow commands?" YES → IMMEDIATE. NO → DELAYED.

> **Paediatric patients (age ≤ 8):** Select JumpSTART from the algorithm dropdown before starting the assessment.

### Triage Categories

| Category | Colour | Meaning | Action |
|---|---|---|---|
| **IMMEDIATE** | Red | Life-threatening injury, survivable with immediate intervention | Treat and transport first |
| **DELAYED** | Yellow | Serious injury, stable for 30–60 minutes | Treat after Immediate patients |
| **MINIMAL** | Green | Minor injury, ambulatory | Self-care or delayed treatment |
| **EXPECTANT** | Black | Unsurvivable injury given available resources | Comfort care only |
| **DECEASED** | Grey | No signs of life | Document and move on |

---

## 4. Patient Tracking Board

The Patient Tracking Board provides a real-time view of all casualties registered under an incident, modelled on the **HICS 254 Disaster Victim/Patient Tracking Form**.

### Reading the Board

Each row shows the provisional ID, current triage category, name (if identity confirmed), estimated age and sex, current disposition, and current location.

### Filtering the Board

Use the triage category filter buttons at the top to focus on a specific category. Search by provisional ID or patient name using the search box.

### Viewing a Casualty's Timeline

Click the arrow (→) at the end of any row to open the **Casualty Detail** page. This page shows the complete, chronological event timeline for that patient — every location change, triage reassessment, and clinical event since first contact. The timeline is immutable: events are never deleted or edited.

### Adding a Tracking Event

On the Casualty Detail page, click **Add Event** to record a new tracking event. Select the event type (e.g., `ARRIVED_FACILITY`, `TO_OR`, `DISCHARGED`) and enter the location and any relevant notes.

### Confirming a Patient's Identity

When a patient's civil identity is established, click **Confirm Identity** on the Casualty Detail page. Enter the first name, last name, and national ID number. The provisional ID is retained as a secondary identifier.

---

## 5. Hospital Command Dashboard

The Command Dashboard provides a real-time overview using the **CO-S-TR** framework.

**Triage Tally** shows the current count of casualties in each category for the selected incident, updating every 30 seconds.

**OR Queue** shows the number of surgical cases currently active in the operating theatre and the number awaiting scheduling.

**Active Incidents** shows the count of incidents currently in ACTIVATED or ESCALATED status.

**Quick Actions** provides one-click navigation to the most frequently used modules during an incident.

---

## 6. OR / Surgical Queue

The OR Queue module manages surgical case prioritisation and tracks each case through the operating theatre workflow.

### Understanding the State Machine

Every surgical case follows a defined sequence of states:

**PROPOSED → SCHEDULED → IN_OR_PREP → INDUCTION → INCISION → CLOSURE → IN_PACU → OUT_PACU → COMPLETE**

Cases can also be **CANCELLED** (from PROPOSED or SCHEDULED) or **ABORTED** (from IN_OR_PREP through CLOSURE).

### Creating a New OR Case

Click **New OR Case** and enter the casualty ID, procedure type, priority score (1–100, where 100 is most urgent), estimated duration, and blood type. Check the **Damage Control Surgery (DCS)** box if this is an abbreviated damage-control procedure.

### Priority Scoring

Priority is a number from 1 to 100. IMMEDIATE casualties with penetrating chest or abdominal trauma typically score 85–100. IMMEDIATE casualties with extremity injuries or burns typically score 60–80. DELAYED casualties typically score 40–60.

### Blood Products and MTP

If a Massive Transfusion Protocol (MTP) is activated, check the **MTP Active** checkbox and update the units of packed red blood cells (pRBC), fresh frozen plasma (FFP), and platelets used as the case progresses. The standard 1:1:1 ratio is the default guideline.

---

## 7. Resources & Logistics

The Resources module provides real-time inventory of all critical resources across facilities.

### Reading the Inventory

Resources are grouped by category: Critical Care, Surgical, Ward beds, Blood Products, PPE, and Medications. Each resource card shows the total count, the number in use (red), and the number available (green), along with a utilisation percentage bar.

A **yellow warning icon** (⚠) appears on any resource card where the available count has fallen to or below the configured low-threshold alert level.

### Updating Resource Counts

Click any resource card to open the edit form. Update the Total, In Use, Available, and In Maintenance counts to reflect the current situation.

---

## 8. Transport Management

The Transport module tracks all patient transport assets assigned to an incident.

### Transport Status Flow

**AVAILABLE → DISPATCHED → EN_ROUTE → AT_SCENE → LOADED → RETURNING → AVAILABLE**

Use the action buttons on each transport card to advance the status as the vehicle moves through its mission.

---

## 9. ICS Forms

The ICS Forms module provides digital versions of the standard Hospital Incident Command System (HICS) forms.

### Available Forms

| Form | Purpose |
|---|---|
| **HICS 201** | Incident Briefing — initial situation summary |
| **HICS 202** | Incident Objectives — operational period goals |
| **HICS 203** | Organisation Assignment — ICS role assignments |
| **HICS 204** | Assignment List — tasks per section |
| **HICS 205A** | Communications List — radio and phone assignments |
| **HICS 213** | General Message — inter-section communications |
| **HICS 214** | Activity Log — chronological record of actions |
| **HICS 254** | Disaster Victim/Patient Tracking |

### Submitting a Form

Select the incident, click the form type button, fill in the required fields, and click **Submit Form**. The recipient can click **Acknowledge** to confirm receipt.

---

## 10. Communications

The Communications module provides incident-scoped messaging organised by operational channel.

### Channels

| Channel | Used by |
|---|---|
| **COMMAND** | Incident Commander, Section Chiefs |
| **OPERATIONS** | Medical teams, clinical staff |
| **LOGISTICS** | Supply, transport, facilities |
| **MEDICAL** | Clinical coordination, physician-to-physician |
| **GENERAL** | All staff, general announcements |

### Message Priority

**ROUTINE** messages appear in the standard list. **URGENT** messages are highlighted in orange. **FLASH** messages are highlighted in red and require explicit acknowledgement.

---

## 11. WHO EMT MDS Reporting

The WHO Emergency Medical Team Minimum Data Set (EMT MDS) module is used by deployed Emergency Medical Teams to submit standardised daily situation reports to the WHO Emergency Medical Team Coordination Cell (EMTCC) and relevant health authorities.

### Completing a Daily Report

Select the incident and click **New Report**. The form covers four categories: Team Information, Daily Summary, MDS Statistics, and Needs and Risks. Click **Submit Report** to record the report.

---

## 12. After-Action Review

The After-Action Review (AAR) module provides a structured analysis of incident performance once an incident has been closed.

### Viewing KPIs

Select any incident from the dropdown (including closed incidents) to view its KPI dashboard.

| KPI | Description |
|---|---|
| **Total Casualties** | All casualties registered under the incident |
| **Deceased** | Casualties with DECEASED triage category |
| **Mortality Rate** | Deceased ÷ Total Casualties × 100% |
| **Discharged** | Casualties with DISCHARGED disposition |
| **OR Cases Completed** | Surgical cases reaching COMPLETE status |
| **Identity Confirmed** | Casualties whose civil identity was confirmed |
| **Incident Duration** | Time from activation to closure |

---

## 13. Family Reunification Portal

The Family Reunification Portal is a **publicly accessible** page that allows family members to enquire about the status of a loved one without signing in. It shows only the patient's general status category — no names, injuries, diagnoses, or other personal health information are displayed.

---

## 14. Admin Panel

The Admin Panel (`/admin`) is accessible to **Admin** and **Super Admin** roles.

### Users Tab

The Users tab lists all platform users. Click the **edit (pencil) icon** on any row to open the full profile editor, which allows you to update:

- Full name and email address
- Job title and phone number
- Role and preferred language
- Facility assignment
- Active / Inactive status

From the edit dialog you can also:

- **Set Password** — immediately replace the user's password
- **Delete User** (Super Admin only) — permanently remove the user account with a confirmation prompt

To add a new user directly (without an invite), click **Add User** (Super Admin only). The user will still need an invite link to set their password and sign in for the first time.

### Invitations Tab

Send invitation links, view all invitations with their status, revoke pending invitations, and resend/extend expired ones.

### Access Requests Tab

Review requests submitted via the landing page. Each request shows the requester's name, email, job title, hospital, and reason. Click **Send Invite** to open the invitation form pre-filled with their email, or **Reject** to decline.

### Facilities Tab

Create and edit hospital/facility records including name (English and Arabic), code, type, city, phone, and capacity figures (total beds, ICU beds, OR rooms, ventilators).

### Audit Log Tab

Chronological record of all significant actions with user, action type, resource, and IP address.

---

## 15. Frequently Asked Questions

**Q: I cannot see the Incidents module. What is wrong?**  
A: Your role may be set to Viewer, which has read-only dashboard access. Contact your administrator to have your role updated.

**Q: I forgot my password. What do I do?**  
A: Go to `/login` and click **Forgot password?**. Enter your email address and submit. Your administrator will receive a notification with a reset link and will forward it to you. Open the link, set a new password, and you will be signed in automatically.

**Q: I accidentally entered the wrong triage category. Can I change it?**  
A: Triage assessments are immutable by design. To correct a category, perform a reassessment by adding a new triage assessment for the same casualty. The most recent assessment is used as the current category.

**Q: The tracking board is not updating. What should I do?**  
A: The board refreshes automatically every 20 seconds. Click the **Refresh** button (↺) at the top of the page. If the problem persists, check your internet connection and reload the page.

**Q: A patient's identity has been confirmed but the system still shows the provisional ID.**  
A: The provisional ID is always retained as a secondary identifier even after identity confirmation. This is intentional — the provisional ID is printed on the physical triage tag and must remain traceable.

**Q: How do I declare a new incident?**  
A: Navigate to **Incidents** and click **Declare Incident**. You will need Incident Commander or Admin role. Enter the incident name, type, severity, location, and estimated casualty count.

**Q: Can I use the platform on my phone?**  
A: Yes. The platform is fully responsive and works on mobile browsers. The sidebar collapses to a hamburger menu on small screens.

**Q: I want to show the platform to someone without giving them an account. Is there a demo?**  
A: Yes. Share the link `{platform-url}/demo` — it is a fully interactive, read-only showcase of all 11 modules with sample data. No login is required.

---

## 16. Quick Reference Card

### Triage Category Colours

| Colour | Category | Action |
|---|---|---|
| 🔴 Red | IMMEDIATE | Treat first — life-threatening, survivable |
| 🟡 Yellow | DELAYED | Treat second — serious but stable |
| 🟢 Green | MINIMAL | Treat last — minor, ambulatory |
| ⬛ Black | EXPECTANT | Comfort care only — unsurvivable |
| ⬜ Grey | DECEASED | Document and move on |

### Key URLs

| URL | Purpose |
|---|---|
| `/login` | Sign in with email and password |
| `/forgot-password` | Request a password reset |
| `/invite/:token` | Accept an invitation and create your account |
| `/demo` | Interactive demo — no login required |
| `/public-portal` | Family reunification portal |
| `/admin` | Admin panel (admin roles only) |

### Emergency Contacts

| Contact | Number |
|---|---|
| Emergency Services | 112 |
| Platform Administrator | Contact via Admin → Users |

---

*This guide covers platform version 1.1. For the most current version, refer to the platform's built-in help or contact your administrator.*

*Saud's MCI Platform*  
*© 2026 Saud Naji Alzaid — MIT License*
