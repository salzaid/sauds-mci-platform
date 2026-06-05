import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users & Auth ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["superadmin", "admin", "incident_commander", "clinician", "triage_officer", "logistics", "viewer"]).default("viewer").notNull(),
  facilityId: int("facilityId"),
  phone: varchar("phone", { length: 32 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  preferredLang: mysqlEnum("preferredLang", ["en", "ar"]).default("en").notNull(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Facilities (Hospitals) ───────────────────────────────────────────────────

export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameAr: varchar("nameAr", { length: 256 }),
  code: varchar("code", { length: 32 }).notNull().unique(),
  type: mysqlEnum("type", ["hospital", "field_hospital", "clinic", "command_center"]).default("hospital").notNull(),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lon: decimal("lon", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 32 }),
  traumaLevel: mysqlEnum("traumaLevel", ["I", "II", "III", "IV", "V"]),
  totalBeds: int("totalBeds").default(0),
  icuBeds: int("icuBeds").default(0),
  orRooms: int("orRooms").default(0),
  ventilators: int("ventilators").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

// ─── Incidents ────────────────────────────────────────────────────────────────

export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  incidentCode: varchar("incidentCode", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 512 }).notNull(),
  nameAr: varchar("nameAr", { length: 512 }),
  type: mysqlEnum("type", ["MASS_CASUALTY", "HAZMAT", "NATURAL_DISASTER", "ACTIVE_SHOOTER", "CHEMICAL", "RADIATION", "BIOLOGICAL", "EXPLOSION", "FIRE", "FLOOD", "OTHER"]).notNull(),
  status: mysqlEnum("status", ["ACTIVATED", "ESCALATED", "DEACTIVATED", "CLOSED"]).default("ACTIVATED").notNull(),
  severity: mysqlEnum("severity", ["LOW", "MODERATE", "HIGH", "CATASTROPHIC"]).default("MODERATE").notNull(),
  locationLat: decimal("locationLat", { precision: 10, scale: 7 }),
  locationLon: decimal("locationLon", { precision: 10, scale: 7 }),
  locationDescription: text("locationDescription"),
  estimatedCasualties: int("estimatedCasualties").default(0),
  commandingOfficerId: int("commandingOfficerId"),
  facilityId: int("facilityId"),
  activatedAt: timestamp("activatedAt").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivatedAt"),
  closedAt: timestamp("closedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

// ─── Casualties ───────────────────────────────────────────────────────────────

export const casualties = mysqlTable("casualties", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  provisionalId: varchar("provisionalId", { length: 64 }).notNull().unique(),
  tagSerial: varchar("tagSerial", { length: 64 }),
  // Known identity (may be filled in later)
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  nationalId: varchar("nationalId", { length: 64 }),
  dateOfBirth: timestamp("dateOfBirth"),
  estimatedAge: int("estimatedAge"),
  sex: mysqlEnum("sex", ["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN").notNull(),
  nationality: varchar("nationality", { length: 64 }),
  // Current status
  currentTriageCategory: mysqlEnum("currentTriageCategory", ["IMMEDIATE", "DELAYED", "MINIMAL", "EXPECTANT", "DECEASED", "UNKNOWN"]).default("UNKNOWN").notNull(),
  currentLocation: varchar("currentLocation", { length: 256 }),
  currentFacilityId: int("currentFacilityId"),
  disposition: mysqlEnum("disposition", ["AT_SCENE", "IN_TRANSPORT", "AT_FACILITY", "DISCHARGED", "TRANSFERRED", "DECEASED"]).default("AT_SCENE").notNull(),
  // Scene info
  locationGps: varchar("locationGps", { length: 64 }),
  triagingClinicianId: int("triagingClinicianId"),
  // Identity reconciliation
  identityConfirmed: boolean("identityConfirmed").default(false).notNull(),
  identityMergedAt: timestamp("identityMergedAt"),
  identityMergedById: int("identityMergedById"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Casualty = typeof casualties.$inferSelect;
export type InsertCasualty = typeof casualties.$inferInsert;

// ─── Casualty Events (Tracking Log — Immutable) ───────────────────────────────

export const casualtyEvents = mysqlTable("casualty_events", {
  id: int("id").autoincrement().primaryKey(),
  casualtyId: int("casualtyId").notNull(),
  incidentId: int("incidentId").notNull(),
  eventType: mysqlEnum("eventType", [
    "TAGGED", "ARRIVED_CCP", "LOADED_TRANSPORT", "ARRIVED_FACILITY",
    "IN_RESUSCITATION", "TO_IMAGING", "TO_OR", "TO_ICU", "TO_WARD",
    "DISCHARGED", "TRANSFERRED", "DECEASED", "REASSESSED", "IDENTITY_CONFIRMED"
  ]).notNull(),
  validTime: timestamp("validTime").notNull(),
  clinicianId: int("clinicianId"),
  facilityId: int("facilityId"),
  transportId: int("transportId"),
  locationDescription: varchar("locationDescription", { length: 256 }),
  triageCategory: mysqlEnum("triageCategory", ["IMMEDIATE", "DELAYED", "MINIMAL", "EXPECTANT", "DECEASED", "UNKNOWN"]),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CasualtyEvent = typeof casualtyEvents.$inferSelect;
export type InsertCasualtyEvent = typeof casualtyEvents.$inferInsert;

// ─── Triage Assessments ───────────────────────────────────────────────────────

export const triageAssessments = mysqlTable("triage_assessments", {
  id: int("id").autoincrement().primaryKey(),
  casualtyId: int("casualtyId").notNull(),
  incidentId: int("incidentId").notNull(),
  algorithm: mysqlEnum("algorithm", ["SALT", "START", "JUMPSTART"]).notNull(),
  category: mysqlEnum("category", ["IMMEDIATE", "DELAYED", "MINIMAL", "EXPECTANT", "DECEASED"]).notNull(),
  // Vital signs
  respiratoryRate: int("respiratoryRate"),
  pulsePresent: boolean("pulsePresent"),
  capRefillSec: decimal("capRefillSec", { precision: 4, scale: 1 }),
  mentalStatus: mysqlEnum("mentalStatus", ["ALERT", "VERBAL", "PAIN", "UNRESPONSIVE", "FOLLOWS_COMMANDS", "NONE"]),
  canWalk: boolean("canWalk"),
  // Interventions
  tourniquet: boolean("tourniquet").default(false),
  airwayOpened: boolean("airwayOpened").default(false),
  needleDecompression: boolean("needleDecompression").default(false),
  autoinjector: boolean("autoinjector").default(false),
  otherIntervention: text("otherIntervention"),
  // Context
  assessedById: int("assessedById"),
  locationGps: varchar("locationGps", { length: 64 }),
  assessedAt: timestamp("assessedAt").notNull(),
  isReassessment: boolean("isReassessment").default(false).notNull(),
  reassessmentCount: int("reassessmentCount").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TriageAssessment = typeof triageAssessments.$inferSelect;
export type InsertTriageAssessment = typeof triageAssessments.$inferInsert;

// ─── OR Cases (Surgical Queue) ────────────────────────────────────────────────

export const orCases = mysqlTable("or_cases", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  casualtyId: int("casualtyId").notNull(),
  facilityId: int("facilityId").notNull(),
  caseCode: varchar("caseCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["PROPOSED", "SCHEDULED", "IN_OR_PREP", "INDUCTION", "INCISION", "CLOSURE", "IN_PACU", "OUT_PACU", "COMPLETE", "CANCELLED", "ABORTED"]).default("PROPOSED").notNull(),
  priority: int("priority").default(50), // 1-100, higher = more urgent
  isDamageControl: boolean("isDamageControl").default(false).notNull(),
  procedureType: varchar("procedureType", { length: 256 }),
  surgeonId: int("surgeonId"),
  anesthesiologistId: int("anesthesiologistId"),
  orRoomId: int("orRoomId"),
  scheduledAt: timestamp("scheduledAt"),
  incisionAt: timestamp("incisionAt"),
  closureAt: timestamp("closureAt"),
  estimatedDurationMin: int("estimatedDurationMin"),
  // Blood products
  bloodType: varchar("bloodType", { length: 8 }),
  mtpActivated: boolean("mtpActivated").default(false),
  rbcUnitsUsed: int("rbcUnitsUsed").default(0),
  ffpUnitsUsed: int("ffpUnitsUsed").default(0),
  plateletsUsed: int("plateletsUsed").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrCase = typeof orCases.$inferSelect;
export type InsertOrCase = typeof orCases.$inferInsert;

// ─── Resources (Inventory) ────────────────────────────────────────────────────

export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull(),
  incidentId: int("incidentId"),
  type: mysqlEnum("type", [
    "VENTILATOR", "ICU_BED", "HDU_BED", "WARD_BED", "OR_ROOM",
    "BLOOD_O_POS", "BLOOD_O_NEG", "BLOOD_A_POS", "BLOOD_A_NEG",
    "BLOOD_B_POS", "BLOOD_B_NEG", "BLOOD_AB_POS", "BLOOD_AB_NEG",
    "PPE_UNIVERSAL", "PPE_DROPLET", "PPE_AIRBORNE", "PPE_CBRN",
    "TXA", "ATROPINE", "PRALIDOXIME", "DIALYSIS_STATION",
    "CT_SCANNER", "CARM", "MRI", "ECMO"
  ]).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  total: int("total").default(0).notNull(),
  inUse: int("inUse").default(0).notNull(),
  available: int("available").default(0).notNull(),
  inMaintenance: int("inMaintenance").default(0).notNull(),
  unit: varchar("unit", { length: 32 }).default("unit"),
  lowThreshold: int("lowThreshold").default(0),
  notes: text("notes"),
  updatedById: int("updatedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// ─── Transports ───────────────────────────────────────────────────────────────

export const transports = mysqlTable("transports", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  transportCode: varchar("transportCode", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["AMBULANCE", "HELICOPTER", "FIXED_WING", "BUS", "OTHER"]).notNull(),
  status: mysqlEnum("status", ["AVAILABLE", "DISPATCHED", "EN_ROUTE", "AT_SCENE", "LOADED", "RETURNING", "OUT_OF_SERVICE"]).default("AVAILABLE").notNull(),
  originFacilityId: int("originFacilityId"),
  destinationFacilityId: int("destinationFacilityId"),
  driverName: varchar("driverName", { length: 128 }),
  attendingClinicianId: int("attendingClinicianId"),
  dispatchedAt: timestamp("dispatchedAt"),
  etaMinutes: int("etaMinutes"),
  arrivedAt: timestamp("arrivedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transport = typeof transports.$inferSelect;
export type InsertTransport = typeof transports.$inferInsert;

// ─── ICS Forms ────────────────────────────────────────────────────────────────

export const icsForms = mysqlTable("ics_forms", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  formType: mysqlEnum("formType", ["HICS_201", "HICS_202", "HICS_203", "HICS_204", "HICS_205A", "HICS_213", "HICS_214", "HICS_254"]).notNull(),
  formData: json("formData").notNull(),
  submittedById: int("submittedById").notNull(),
  acknowledgedById: int("acknowledgedById"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  status: mysqlEnum("status", ["DRAFT", "SUBMITTED", "ACKNOWLEDGED", "SUPERSEDED"]).default("DRAFT").notNull(),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IcsForm = typeof icsForms.$inferSelect;
export type InsertIcsForm = typeof icsForms.$inferInsert;

// ─── WHO EMT MDS Reports ──────────────────────────────────────────────────────

export const emtMdsReports = mysqlTable("emt_mds_reports", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  facilityId: int("facilityId").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  reportData: json("reportData").notNull(),
  submittedById: int("submittedById").notNull(),
  status: mysqlEnum("status", ["DRAFT", "SUBMITTED", "EXPORTED"]).default("DRAFT").notNull(),
  exportedAt: timestamp("exportedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmtMdsReport = typeof emtMdsReports.$inferSelect;
export type InsertEmtMdsReport = typeof emtMdsReports.$inferInsert;

// ─── Communications Messages ──────────────────────────────────────────────────

export const commsMessages = mysqlTable("comms_messages", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  senderId: int("senderId").notNull(),
  channel: mysqlEnum("channel", ["COMMAND", "OPERATIONS", "LOGISTICS", "MEDICAL", "GENERAL"]).default("GENERAL").notNull(),
  messageType: mysqlEnum("messageType", ["TEXT", "ALERT", "ICS_213", "STATUS_UPDATE"]).default("TEXT").notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority", ["ROUTINE", "URGENT", "FLASH"]).default("ROUTINE").notNull(),
  acknowledgedById: int("acknowledgedById"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommsMessage = typeof commsMessages.$inferSelect;
export type InsertCommsMessage = typeof commsMessages.$inferInsert;

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId: varchar("resourceId", { length: 64 }),
  incidentId: int("incidentId"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Invitations ──────────────────────────────────────────────────────────────

export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["superadmin","admin","incident_commander","clinician","triage_officer","logistics","viewer"]).default("viewer").notNull(),
  facilityId: int("facilityId"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  invitedById: int("invitedById").notNull(),
  invitedByName: varchar("invitedByName", { length: 256 }),
  message: text("message"),
  status: mysqlEnum("status", ["PENDING","ACCEPTED","REVOKED","EXPIRED"]).default("PENDING").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedByUserId: int("acceptedByUserId"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ─── Access Requests ────────────────────────────────────────────────────────────

export const accessRequests = mysqlTable("access_requests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 128 }).notNull(),
  facility: varchar("facility", { length: 256 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["PENDING","INVITED","REJECTED"]).default("PENDING").notNull(),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

// ─── Password Reset Requests ───────────────────────────────────────────────────────────────────────────────────

export const passwordResetRequests = mysqlTable("password_reset_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 256 }),
  resetToken: varchar("resetToken", { length: 128 }).notNull(),
  resetUrl: text("resetUrl").notNull(),
  status: mysqlEnum("status", ["PENDING","USED","EXPIRED"]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
