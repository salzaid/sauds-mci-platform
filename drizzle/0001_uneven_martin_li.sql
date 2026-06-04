CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userEmail` varchar(320),
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64),
	`resourceId` varchar(64),
	`incidentId` int,
	`ipAddress` varchar(64),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `casualties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`provisionalId` varchar(64) NOT NULL,
	`tagSerial` varchar(64),
	`firstName` varchar(128),
	`lastName` varchar(128),
	`nationalId` varchar(64),
	`dateOfBirth` timestamp,
	`estimatedAge` int,
	`sex` enum('MALE','FEMALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
	`nationality` varchar(64),
	`currentTriageCategory` enum('IMMEDIATE','DELAYED','MINIMAL','EXPECTANT','DECEASED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
	`currentLocation` varchar(256),
	`currentFacilityId` int,
	`disposition` enum('AT_SCENE','IN_TRANSPORT','AT_FACILITY','DISCHARGED','TRANSFERRED','DECEASED') NOT NULL DEFAULT 'AT_SCENE',
	`locationGps` varchar(64),
	`triagingClinicianId` int,
	`identityConfirmed` boolean NOT NULL DEFAULT false,
	`identityMergedAt` timestamp,
	`identityMergedById` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `casualties_id` PRIMARY KEY(`id`),
	CONSTRAINT `casualties_provisionalId_unique` UNIQUE(`provisionalId`)
);
--> statement-breakpoint
CREATE TABLE `casualty_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`casualtyId` int NOT NULL,
	`incidentId` int NOT NULL,
	`eventType` enum('TAGGED','ARRIVED_CCP','LOADED_TRANSPORT','ARRIVED_FACILITY','IN_RESUSCITATION','TO_IMAGING','TO_OR','TO_ICU','TO_WARD','DISCHARGED','TRANSFERRED','DECEASED','REASSESSED','IDENTITY_CONFIRMED') NOT NULL,
	`validTime` timestamp NOT NULL,
	`clinicianId` int,
	`facilityId` int,
	`transportId` int,
	`locationDescription` varchar(256),
	`triageCategory` enum('IMMEDIATE','DELAYED','MINIMAL','EXPECTANT','DECEASED','UNKNOWN'),
	`notes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `casualty_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comms_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`senderId` int NOT NULL,
	`channel` enum('COMMAND','OPERATIONS','LOGISTICS','MEDICAL','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`messageType` enum('TEXT','ALERT','ICS_213','STATUS_UPDATE') NOT NULL DEFAULT 'TEXT',
	`content` text NOT NULL,
	`priority` enum('ROUTINE','URGENT','FLASH') NOT NULL DEFAULT 'ROUTINE',
	`acknowledgedById` int,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comms_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emt_mds_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`facilityId` int NOT NULL,
	`reportDate` timestamp NOT NULL,
	`reportData` json NOT NULL,
	`submittedById` int NOT NULL,
	`status` enum('DRAFT','SUBMITTED','EXPORTED') NOT NULL DEFAULT 'DRAFT',
	`exportedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emt_mds_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`nameAr` varchar(256),
	`code` varchar(32) NOT NULL,
	`type` enum('hospital','field_hospital','clinic','command_center') NOT NULL DEFAULT 'hospital',
	`address` text,
	`city` varchar(128),
	`lat` decimal(10,7),
	`lon` decimal(10,7),
	`phone` varchar(32),
	`traumaLevel` enum('I','II','III','IV','V'),
	`totalBeds` int DEFAULT 0,
	`icuBeds` int DEFAULT 0,
	`orRooms` int DEFAULT 0,
	`ventilators` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`),
	CONSTRAINT `facilities_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ics_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`formType` enum('HICS_201','HICS_202','HICS_203','HICS_204','HICS_205A','HICS_213','HICS_214','HICS_254') NOT NULL,
	`formData` json NOT NULL,
	`submittedById` int NOT NULL,
	`acknowledgedById` int,
	`acknowledgedAt` timestamp,
	`status` enum('DRAFT','SUBMITTED','ACKNOWLEDGED','SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ics_forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentCode` varchar(64) NOT NULL,
	`name` varchar(512) NOT NULL,
	`nameAr` varchar(512),
	`type` enum('MASS_CASUALTY','HAZMAT','NATURAL_DISASTER','ACTIVE_SHOOTER','CHEMICAL','RADIATION','BIOLOGICAL','EXPLOSION','FIRE','FLOOD','OTHER') NOT NULL,
	`status` enum('ACTIVATED','ESCALATED','DEACTIVATED','CLOSED') NOT NULL DEFAULT 'ACTIVATED',
	`severity` enum('LOW','MODERATE','HIGH','CATASTROPHIC') NOT NULL DEFAULT 'MODERATE',
	`locationLat` decimal(10,7),
	`locationLon` decimal(10,7),
	`locationDescription` text,
	`estimatedCasualties` int DEFAULT 0,
	`commandingOfficerId` int,
	`facilityId` int,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	`deactivatedAt` timestamp,
	`closedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`),
	CONSTRAINT `incidents_incidentCode_unique` UNIQUE(`incidentCode`)
);
--> statement-breakpoint
CREATE TABLE `or_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`casualtyId` int NOT NULL,
	`facilityId` int NOT NULL,
	`caseCode` varchar(64) NOT NULL,
	`status` enum('PROPOSED','SCHEDULED','IN_OR_PREP','INDUCTION','INCISION','CLOSURE','IN_PACU','OUT_PACU','COMPLETE','CANCELLED','ABORTED') NOT NULL DEFAULT 'PROPOSED',
	`priority` int DEFAULT 50,
	`isDamageControl` boolean NOT NULL DEFAULT false,
	`procedureType` varchar(256),
	`surgeonId` int,
	`anesthesiologistId` int,
	`orRoomId` int,
	`scheduledAt` timestamp,
	`incisionAt` timestamp,
	`closureAt` timestamp,
	`estimatedDurationMin` int,
	`bloodType` varchar(8),
	`mtpActivated` boolean DEFAULT false,
	`rbcUnitsUsed` int DEFAULT 0,
	`ffpUnitsUsed` int DEFAULT 0,
	`plateletsUsed` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `or_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `or_cases_caseCode_unique` UNIQUE(`caseCode`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityId` int NOT NULL,
	`incidentId` int,
	`type` enum('VENTILATOR','ICU_BED','HDU_BED','WARD_BED','OR_ROOM','BLOOD_O_POS','BLOOD_O_NEG','BLOOD_A_POS','BLOOD_A_NEG','BLOOD_B_POS','BLOOD_B_NEG','BLOOD_AB_POS','BLOOD_AB_NEG','PPE_UNIVERSAL','PPE_DROPLET','PPE_AIRBORNE','PPE_CBRN','TXA','ATROPINE','PRALIDOXIME','DIALYSIS_STATION','CT_SCANNER','CARM','MRI','ECMO') NOT NULL,
	`name` varchar(256) NOT NULL,
	`total` int NOT NULL DEFAULT 0,
	`inUse` int NOT NULL DEFAULT 0,
	`available` int NOT NULL DEFAULT 0,
	`inMaintenance` int NOT NULL DEFAULT 0,
	`unit` varchar(32) DEFAULT 'unit',
	`lowThreshold` int DEFAULT 0,
	`notes` text,
	`updatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`transportCode` varchar(64) NOT NULL,
	`type` enum('AMBULANCE','HELICOPTER','FIXED_WING','BUS','OTHER') NOT NULL,
	`status` enum('AVAILABLE','DISPATCHED','EN_ROUTE','AT_SCENE','LOADED','RETURNING','OUT_OF_SERVICE') NOT NULL DEFAULT 'AVAILABLE',
	`originFacilityId` int,
	`destinationFacilityId` int,
	`driverName` varchar(128),
	`attendingClinicianId` int,
	`dispatchedAt` timestamp,
	`etaMinutes` int,
	`arrivedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transports_id` PRIMARY KEY(`id`),
	CONSTRAINT `transports_transportCode_unique` UNIQUE(`transportCode`)
);
--> statement-breakpoint
CREATE TABLE `triage_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`casualtyId` int NOT NULL,
	`incidentId` int NOT NULL,
	`algorithm` enum('SALT','START','JUMPSTART') NOT NULL,
	`category` enum('IMMEDIATE','DELAYED','MINIMAL','EXPECTANT','DECEASED') NOT NULL,
	`respiratoryRate` int,
	`pulsePresent` boolean,
	`capRefillSec` decimal(4,1),
	`mentalStatus` enum('ALERT','VERBAL','PAIN','UNRESPONSIVE','FOLLOWS_COMMANDS','NONE'),
	`canWalk` boolean,
	`tourniquet` boolean DEFAULT false,
	`airwayOpened` boolean DEFAULT false,
	`needleDecompression` boolean DEFAULT false,
	`autoinjector` boolean DEFAULT false,
	`otherIntervention` text,
	`assessedById` int,
	`locationGps` varchar(64),
	`assessedAt` timestamp NOT NULL,
	`isReassessment` boolean NOT NULL DEFAULT false,
	`reassessmentCount` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `triage_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('superadmin','admin','incident_commander','clinician','triage_officer','logistics','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE `users` ADD `facilityId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `jobTitle` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLang` enum('en','ar') DEFAULT 'en' NOT NULL;