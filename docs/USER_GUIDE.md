# Saud's MCI Platform — End-User Guide

**For Medical and Healthcare Personnel**

**Platform:** Saud's MCI & Disaster Management Platform  
**Version:** 1.0  
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
14. [Frequently Asked Questions](#14-frequently-asked-questions)
15. [Quick Reference Card](#15-quick-reference-card)

---

## 1. Getting Started

### Accessing the Platform

Access to Saud's MCI Platform is **invite-only**. You will receive a personalised invitation link from your hospital administrator or incident commander. The link looks like this:

```
https://mci.your-hospital.gov.kw/invite/AbCdEfGh...
```

When you open the link, you will see a page showing your assigned role and the name of the person who invited you. Click **Accept Invitation & Enter Platform** to sign in. You will be asked to authenticate with your Manus account (Google or email). After authentication, your role is applied automatically and you are taken to the dashboard.

> **Invitation links expire after 7 days.** If your link has expired, contact your administrator to request a new one.

### Requesting Access

If you have not received an invitation, visit the platform's main page and click **Request Access**. Fill in your name, email address, job title, hospital, and a brief description of why you need access. Your administrator will be notified and will send you an invitation if approved.

### Your Role

Your role determines which modules you can access and what actions you can perform. The table below summarises the typical roles assigned to clinical and operational staff.

| Role | Typical Staff | Key Capabilities |
|---|---|---|
| **Incident Commander** | Medical director, ED chief | Declare incidents, access all modules, manage ICS forms |
| **Clinician** | Emergency physician, surgeon, nurse | Triage, patient tracking, OR queue, communications |
| **Triage Officer** | Paramedic, triage nurse | Scene triage, casualty registration |
| **Logistics** | Logistics coordinator, supply officer | Resources, transport, EMT MDS reporting |
| **Viewer** | Observers, trainees | Read-only access to dashboards |

### Language

The platform supports both **English** and **Arabic (RTL)**. To switch languages, click your name in the bottom-left corner of the sidebar and select the language toggle. Your preference is saved automatically.

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

The Scene Triage module guides you through the **SALT** (Sort-Assess-Lifesaving interventions-Treatment/Transport) triage algorithm — the nationally endorsed US all-hazards triage standard — and records each casualty's assessment in real time.

### Selecting an Incident

Before registering casualties, select the active incident from the dropdown at the top of the Triage page. If no incident is listed, it must first be declared in the **Incidents** module by an Incident Commander or Admin.

### Registering a New Casualty

Click **Register Casualty** to open the registration form. Enter the physical triage tag serial number (if available), the patient's estimated age, sex, and GPS coordinates if your device provides them. Click **Register & Start SALT Triage** to proceed immediately to the guided triage assessment.

### Completing the SALT Assessment

The SALT assessment presents one question at a time with large YES / NO buttons designed for use with gloves or in low-light conditions. The questions follow this sequence:

**Step 1 — Sort:** "Can the patient walk to a designated area?" A YES answer immediately assigns the MINIMAL (Green) category. A NO answer proceeds to Step 2.

**Step 2 — Life Threat:** "Does the patient have obvious life-threatening haemorrhage or airway obstruction?" A YES answer asks whether a lifesaving intervention is feasible. If not feasible, the patient is assigned EXPECTANT (Black). If feasible, perform the intervention and proceed to Step 3.

**Step 3 — Vital Signs:** "Is the respiratory rate abnormal (< 10 or > 30/min), pulse absent, or does the patient fail to follow commands?" A YES answer assigns IMMEDIATE (Red). A NO answer assigns DELAYED (Yellow).

At the end of the assessment, you will see the triage category displayed prominently. Click **Confirm Triage** to record the assessment. The casualty is added to the tracking board immediately.

> **Paediatric patients (age ≤ 8):** The JumpSTART algorithm is recommended for children. Select JumpSTART from the algorithm dropdown before starting the assessment. The key difference is that JumpSTART checks for the presence of a pulse before assessing respiratory rate, and uses 5 rescue breaths as an intervention step for apnoeic patients with a pulse.

### Triage Categories

| Category | Colour | Meaning | Action |
|---|---|---|---|
| **IMMEDIATE** | Red | Life-threatening injury, survivable with immediate intervention | Treat and transport first |
| **DELAYED** | Yellow | Serious injury, stable for 30–60 minutes | Treat after Immediate patients |
| **MINIMAL** | Green | Minor injury, ambulatory | Self-care or delayed treatment |
| **EXPECTANT** | Black | Unsurvivable injury given available resources | Comfort care only |
| **DECEASED** | Grey | No signs of life | Document and move on |

### Reassessment

Triage categories must be reassessed at every transition point: scene → Casualty Collection Point, CCP → transport, and transport → ED. To reassess a casualty, open their record from the casualty list and click **Add Event**, selecting the appropriate event type. Then return to the Triage page and add a new triage assessment for that casualty — each reassessment is recorded as a separate entry and never overwrites the original.

---

## 4. Patient Tracking Board

The Patient Tracking Board provides a real-time view of all casualties registered under an incident, modelled on the **HICS 254 Disaster Victim/Patient Tracking Form**.

### Reading the Board

Each row in the tracking table represents one casualty. The columns show the provisional ID (e.g., `MCI-2026-ALPHA1-T0042`), current triage category, name (if identity has been confirmed), estimated age and sex, current disposition, and current location.

The **Disposition** column indicates where the patient is in the care pathway:

| Disposition | Meaning |
|---|---|
| AT_SCENE | Still at the incident scene |
| IN_TRANSPORT | En route to a facility |
| AT_FACILITY | Receiving care at a hospital |
| DISCHARGED | Discharged from care |
| TRANSFERRED | Transferred to another facility |
| DECEASED | Deceased |

### Filtering the Board

Use the triage category filter buttons at the top of the board to focus on a specific category (e.g., show only IMMEDIATE patients). You can also search by provisional ID or patient name using the search box.

### Viewing a Casualty's Timeline

Click the arrow (→) at the end of any row to open the **Casualty Detail** page. This page shows the complete, chronological event timeline for that patient — every location change, triage reassessment, and clinical event since first contact. The timeline is immutable: events are never deleted or edited.

### Adding a Tracking Event

On the Casualty Detail page, click **Add Event** to record a new tracking event. Select the event type from the dropdown (e.g., `ARRIVED_FACILITY`, `TO_OR`, `DISCHARGED`) and enter the location and any relevant notes. The event is appended to the timeline immediately.

### Confirming a Patient's Identity

When a patient's civil identity is established (via civil ID, passport, or family identification), click **Confirm Identity** on the Casualty Detail page. Enter the first name, last name, and national ID number. The provisional ID is retained as a secondary identifier and the identity confirmation is logged in the audit trail.

---

## 5. Hospital Command Dashboard

The Command Dashboard provides a real-time overview of the incident using the **CO-S-TR** framework — Command, Staff/Stuff/Space, Triage/Treatment/Tracking/Transport.

### Dashboard Tiles

**Triage Tally** shows the current count of casualties in each category (Immediate, Delayed, Minimal, Expectant, Deceased) for the selected incident. This updates automatically every 30 seconds.

**OR Queue** shows the number of surgical cases currently active in the operating theatre and the number awaiting scheduling.

**Active Incidents** shows the count of incidents currently in ACTIVATED or ESCALATED status across all facilities.

**Quick Actions** provides one-click navigation to the most frequently used modules during an incident: Declare Incident, Register Casualty, OR Queue, Resources, ICS Forms, and After-Action Review.

### Selecting an Incident for Detail

From the Incidents page, click any incident to open its detail view. The incident detail page shows the live triage tally for that specific incident, quick navigation to all related modules (Triage, Tracking, OR Queue, Transport, ICS Forms, Communications), and the incident's status with a dropdown to transition it through the lifecycle.

---

## 6. OR / Surgical Queue

The OR Queue module manages surgical case prioritisation and tracks each case through the operating theatre workflow.

### Understanding the State Machine

Every surgical case follows a defined sequence of states. You advance a case to the next state by clicking the transition button on the case card. The sequence is:

**PROPOSED → SCHEDULED → IN_OR_PREP → INDUCTION → INCISION → CLOSURE → IN_PACU → OUT_PACU → COMPLETE**

Cases can also be **CANCELLED** (from PROPOSED or SCHEDULED) or **ABORTED** (from IN_OR_PREP through CLOSURE). These are terminal states — a case cannot be reactivated once cancelled or aborted.

### Creating a New OR Case

Click **New OR Case** and enter the casualty ID, procedure type, priority score (1–100, where 100 is most urgent), estimated duration, and blood type. Check the **Damage Control Surgery (DCS)** box if this is an abbreviated damage-control procedure — this flags the case for the surgical team and influences scheduling priority.

### Priority Scoring

Priority is a number from 1 to 100. As a guide: IMMEDIATE casualties with penetrating chest or abdominal trauma typically score 85–100. IMMEDIATE casualties with extremity injuries or burns typically score 60–80. DELAYED casualties typically score 40–60.

### Blood Products and MTP

If a Massive Transfusion Protocol (MTP) is activated for a case, check the **MTP Active** checkbox and update the units of packed red blood cells (pRBC), fresh frozen plasma (FFP), and platelets used as the case progresses. The standard 1:1:1 ratio (1 unit pRBC : 1 unit FFP : 1 unit platelets) is the default guideline.

### Filtering the Queue

Use the status filter buttons to view cases by state. The **Active** filter (default) shows all cases that are currently in progress or awaiting the OR. The **All** filter shows the complete history including completed and cancelled cases.

---

## 7. Resources & Logistics

The Resources module provides real-time inventory of all critical resources across facilities.

### Reading the Inventory

Resources are grouped by category: Critical Care (ventilators, ICU beds, ECMO), Surgical (OR rooms, CT, C-arm, MRI), Ward beds, Blood Products, PPE, and Medications. Each resource card shows the total count, the number currently in use (red), and the number available (green), along with a utilisation percentage bar.

A **yellow warning icon** (⚠) appears on any resource card where the available count has fallen to or below the configured low-threshold alert level.

### Updating Resource Counts

Click any resource card to open the edit form. Update the Total, In Use, Available, and In Maintenance counts to reflect the current situation. Changes take effect immediately and are visible to all users on the platform.

### Adding a New Resource

Click **Add Resource**, select the resource type from the dropdown, give it a descriptive name (e.g., "ICU Ventilator Bay A"), and enter the initial counts. Set a **Low Alert Threshold** to receive a visual warning when available units fall to that level.

---

## 8. Transport Management

The Transport module tracks all patient transport assets (ambulances, helicopters, fixed-wing aircraft) assigned to an incident.

### Transport Status Flow

Each transport asset moves through the following status sequence:

**AVAILABLE → DISPATCHED → EN_ROUTE → AT_SCENE → LOADED → RETURNING → AVAILABLE**

Use the action buttons on each transport card to advance the status as the vehicle moves through its mission. The status is visible to all users and feeds into the transport queue count on the Command Dashboard.

### Creating a Transport Record

Click **Add Transport**, select the vehicle type, enter the driver or crew name, and set the estimated time of arrival (ETA) in minutes. The transport is created with AVAILABLE status and can be dispatched immediately.

---

## 9. ICS Forms

The ICS Forms module provides digital versions of the standard Hospital Incident Command System (HICS) forms required during a declared incident.

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
| **HICS 254** | Disaster Victim/Patient Tracking — auto-populated from the Tracking module |

### Submitting a Form

Select the incident, click the form type button (e.g., **HICS 213**), fill in the required fields, and click **Submit Form**. Submitted forms appear in the form history list with a SUBMITTED status. The recipient or section chief can click **Acknowledge** to confirm receipt.

### Acknowledging a Form

When you receive a HICS 213 General Message or other form requiring acknowledgement, find it in the form list (it will show SUBMITTED status) and click **Acknowledge**. The form status changes to ACKNOWLEDGED and the submission time is recorded.

---

## 10. Communications

The Communications module provides incident-scoped messaging organised by operational channel.

### Channels

Messages are organised into five channels, each corresponding to an ICS section:

| Channel | Used by |
|---|---|
| **COMMAND** | Incident Commander, Section Chiefs |
| **OPERATIONS** | Medical teams, clinical staff |
| **LOGISTICS** | Supply, transport, facilities |
| **MEDICAL** | Clinical coordination, physician-to-physician |
| **GENERAL** | All staff, general announcements |

### Message Priority

Every message has a priority level. **ROUTINE** messages appear in the standard message list. **URGENT** messages are highlighted in orange. **FLASH** messages are highlighted in red and require explicit acknowledgement by the recipient.

### Sending a Message

Select the incident and channel, choose the priority level, type your message, and press **Enter** or click the send button. Messages are visible to all users with access to that incident.

### Acknowledging URGENT and FLASH Messages

URGENT and FLASH messages display a green checkmark button. Click it to acknowledge receipt. The acknowledgement timestamp is recorded and visible to the sender.

---

## 11. WHO EMT MDS Reporting

The WHO Emergency Medical Team Minimum Data Set (EMT MDS) module is used by deployed Emergency Medical Teams to submit standardised daily situation reports to the WHO Emergency Medical Team Coordination Cell (EMTCC) and relevant health authorities.

### Completing a Daily Report

Select the incident and click **New Report**. The form covers the four WHO EMT MDS categories:

**Team Information** — your organisation name and EMT classification (EMT-1, EMT-2, or EMT-3).

**Daily Summary** — total consultations, new admissions, total bed capacity, and other summary statistics for the reporting period.

**MDS Statistics** — detailed breakdown by health event type (trauma, infectious disease, emergency, other), procedures performed, and patient outcomes (deaths, discharges, referrals).

**Needs and Risks** — operational constraints, community health risks, and resource needs for the next reporting period.

Click **Submit Report** to record the report. Submitted reports can be exported for transmission to the WHO EMTCC gateway or the relevant national health authority endpoint.

---

## 12. After-Action Review

The After-Action Review (AAR) module provides a structured analysis of incident performance once an incident has been closed.

### Viewing KPIs

Select any incident from the dropdown (including closed incidents) to view its KPI dashboard. The following metrics are displayed:

| KPI | Description |
|---|---|
| **Total Casualties** | All casualties registered under the incident |
| **Deceased** | Casualties with DECEASED triage category |
| **Mortality Rate** | Deceased ÷ Total Casualties × 100% |
| **Discharged** | Casualties with DISCHARGED disposition |
| **OR Cases Completed** | Surgical cases reaching COMPLETE status |
| **Identity Confirmed** | Casualties whose civil identity was confirmed |
| **Incident Duration** | Time from activation to closure |

### Using the AAR for Learning

The AAR data should be reviewed in a structured debrief with all participating teams. Key questions to address include: Were triage categories appropriate (over-triage and under-triage rates)? Were OR cases prioritised correctly? Were resources sufficient? Were communications timely and acknowledged? Were all casualties' identities confirmed before discharge?

---

## 13. Family Reunification Portal

The Family Reunification Portal is a **publicly accessible** page that allows family members to enquire about the status of a loved one involved in a mass casualty incident. It is accessible from the main platform page without signing in.

### What Information is Available

The portal shows only the patient's general status category (e.g., "Receiving Treatment", "Discharged", "Transferred"). No names, injuries, diagnoses, or other personal health information are displayed. This is by design to protect patient privacy in accordance with applicable data protection regulations including HIPAA and GDPR.

### How to Search

Family members enter the patient's civil ID number or provisional triage tag number (if known) and submit the search. If a match is found, the status is displayed. If no match is found, the family member is directed to call the emergency helpline (112).

---

## 14. Frequently Asked Questions

**Q: I cannot see the Incidents module. What is wrong?**  
A: Your role may be set to Viewer, which has read-only dashboard access. Contact your administrator to have your role updated to Clinician, Triage Officer, or Incident Commander as appropriate.

**Q: I accidentally entered the wrong triage category. Can I change it?**  
A: Triage assessments are immutable by design — they cannot be edited or deleted. This preserves the integrity of the clinical record. To correct a category, perform a reassessment by adding a new triage assessment for the same casualty. The most recent assessment is used as the current category.

**Q: The tracking board is not updating. What should I do?**  
A: The board refreshes automatically every 20 seconds. If it appears stale, click the **Refresh** button (↺) at the top of the page. If the problem persists, check your internet connection and reload the page.

**Q: A patient's identity has been confirmed but the system still shows the provisional ID.**  
A: The provisional ID is always retained as a secondary identifier even after identity confirmation. This is intentional — the provisional ID is printed on the physical triage tag and must remain traceable. The patient's confirmed name will appear alongside the provisional ID on all screens.

**Q: I need to transfer a patient to another hospital. What do I do?**  
A: First, create a transport record in the **Transport** module for the receiving vehicle. Then, on the patient's Casualty Detail page, add a `LOADED_TRANSPORT` event with the transport ID and destination facility. When the patient arrives, add an `ARRIVED_FACILITY` event. This creates the complete transfer record in the tracking log.

**Q: How do I declare a new incident?**  
A: Navigate to **Incidents** and click **Declare Incident**. You will need Incident Commander or Admin role to do this. Enter the incident name (in English and optionally Arabic), type, severity, location, and estimated casualty count. The incident is activated immediately upon creation.

**Q: Can I use the platform on my phone?**  
A: Yes. The platform is fully responsive and works on mobile browsers. The sidebar collapses to a hamburger menu on small screens. For triage work in the field, the large touch-target buttons on the SALT assessment screen are specifically designed for use with gloves.

---

## 15. Quick Reference Card

### Triage Category Colours

| Colour | Category | Action |
|---|---|---|
| 🔴 Red | IMMEDIATE | Treat first — life-threatening, survivable |
| 🟡 Yellow | DELAYED | Treat second — serious but stable |
| 🟢 Green | MINIMAL | Treat last — minor, ambulatory |
| ⬛ Black | EXPECTANT | Comfort care only — unsurvivable |
| ⬜ Grey | DECEASED | Document and move on |

### Key Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Send message in Communications | Enter |
| New line in message | Shift + Enter |

### Emergency Contacts

| Contact | Number |
|---|---|
| Emergency Services | 112 |
| Platform Administrator | Contact via Admin → Users |

---

*This guide covers platform version 1.0. For the most current version, refer to the platform's built-in help or contact your administrator.*

*Saud's MCI Platform*  
*© 2026 Saud Naji Alzaid — MIT License*
