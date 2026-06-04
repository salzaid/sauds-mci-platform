import { describe, it, expect } from "vitest";

// SALT triage algorithm state machine
type TriageCategory = "IMMEDIATE" | "DELAYED" | "MINIMAL" | "EXPECTANT" | "DECEASED";

interface SALTInput {
  canWalk: boolean;
  hasLifeThreat: boolean;
  lsiPossible: boolean;
  respiratoryRate: number;
  pulsePresent: boolean;
  followsCommands: boolean;
}

function runSALT(input: SALTInput): TriageCategory {
  // Step 1: Sort — can walk?
  if (input.canWalk) return "MINIMAL";
  // Step 2: Life-threatening hemorrhage or airway obstruction?
  if (input.hasLifeThreat) {
    if (!input.lsiPossible) return "EXPECTANT";
    // After LSI: re-assess vitals
  }
  // Step 3: Assess vitals
  const abnormalRR = input.respiratoryRate > 30 || input.respiratoryRate < 10;
  const abnormalPerfusion = !input.pulsePresent;
  const abnormalMental = !input.followsCommands;
  if (abnormalRR || abnormalPerfusion || abnormalMental) return "IMMEDIATE";
  return "DELAYED";
}

// OR case state machine
type ORStatus = "PROPOSED" | "SCHEDULED" | "IN_OR_PREP" | "INDUCTION" | "INCISION" | "CLOSURE" | "IN_PACU" | "OUT_PACU" | "COMPLETE" | "CANCELLED" | "ABORTED";

const validTransitions: Record<ORStatus, ORStatus[]> = {
  PROPOSED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["IN_OR_PREP", "CANCELLED"],
  IN_OR_PREP: ["INDUCTION", "ABORTED"],
  INDUCTION: ["INCISION", "ABORTED"],
  INCISION: ["CLOSURE", "ABORTED"],
  CLOSURE: ["IN_PACU"],
  IN_PACU: ["OUT_PACU"],
  OUT_PACU: ["COMPLETE"],
  COMPLETE: [],
  CANCELLED: [],
  ABORTED: [],
};

function canTransition(from: ORStatus, to: ORStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

// Provisional ID generation
function generateProvisionalId(incidentCode: string, tagNumber: number): string {
  return `${incidentCode}-T${String(tagNumber).padStart(4, "0")}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SALT Triage Algorithm", () => {
  it("ambulatory patient → MINIMAL", () => {
    expect(runSALT({ canWalk: true, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 18, pulsePresent: true, followsCommands: true })).toBe("MINIMAL");
  });

  it("non-ambulatory with normal vitals → DELAYED", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 18, pulsePresent: true, followsCommands: true })).toBe("DELAYED");
  });

  it("non-ambulatory with high RR → IMMEDIATE", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 35, pulsePresent: true, followsCommands: true })).toBe("IMMEDIATE");
  });

  it("non-ambulatory with no pulse → IMMEDIATE", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 18, pulsePresent: false, followsCommands: true })).toBe("IMMEDIATE");
  });

  it("non-ambulatory, cannot follow commands → IMMEDIATE", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 18, pulsePresent: true, followsCommands: false })).toBe("IMMEDIATE");
  });

  it("life threat present, LSI not possible → EXPECTANT", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: true, lsiPossible: false, respiratoryRate: 18, pulsePresent: true, followsCommands: true })).toBe("EXPECTANT");
  });

  it("life threat present, LSI possible, normal vitals → DELAYED", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: true, lsiPossible: true, respiratoryRate: 18, pulsePresent: true, followsCommands: true })).toBe("DELAYED");
  });

  it("respiratory rate at boundary (10/min) → DELAYED (not abnormal)", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 10, pulsePresent: true, followsCommands: true })).toBe("DELAYED");
  });

  it("respiratory rate below boundary (9/min) → IMMEDIATE", () => {
    expect(runSALT({ canWalk: false, hasLifeThreat: false, lsiPossible: false, respiratoryRate: 9, pulsePresent: true, followsCommands: true })).toBe("IMMEDIATE");
  });
});

describe("OR Case State Machine", () => {
  it("PROPOSED → SCHEDULED is valid", () => expect(canTransition("PROPOSED", "SCHEDULED")).toBe(true));
  it("PROPOSED → CANCELLED is valid", () => expect(canTransition("PROPOSED", "CANCELLED")).toBe(true));
  it("PROPOSED → INCISION is invalid", () => expect(canTransition("PROPOSED", "INCISION")).toBe(false));
  it("SCHEDULED → IN_OR_PREP is valid", () => expect(canTransition("SCHEDULED", "IN_OR_PREP")).toBe(true));
  it("INCISION → CLOSURE is valid", () => expect(canTransition("INCISION", "CLOSURE")).toBe(true));
  it("INCISION → ABORTED is valid", () => expect(canTransition("INCISION", "ABORTED")).toBe(true));
  it("CLOSURE → IN_PACU is valid", () => expect(canTransition("CLOSURE", "IN_PACU")).toBe(true));
  it("COMPLETE → anything is invalid", () => {
    expect(canTransition("COMPLETE", "PROPOSED")).toBe(false);
    expect(canTransition("COMPLETE", "SCHEDULED")).toBe(false);
  });
  it("CANCELLED → anything is invalid", () => expect(canTransition("CANCELLED", "PROPOSED")).toBe(false));
  it("full happy path is valid", () => {
    const path: ORStatus[] = ["PROPOSED","SCHEDULED","IN_OR_PREP","INDUCTION","INCISION","CLOSURE","IN_PACU","OUT_PACU","COMPLETE"];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i+1])).toBe(true);
    }
  });
});

describe("Provisional ID Generation", () => {
  it("generates correct format", () => {
    expect(generateProvisionalId("MCI-2026-ABC123", 1)).toBe("MCI-2026-ABC123-T0001");
    expect(generateProvisionalId("MCI-2026-ABC123", 42)).toBe("MCI-2026-ABC123-T0042");
    expect(generateProvisionalId("MCI-2026-ABC123", 1000)).toBe("MCI-2026-ABC123-T1000");
  });

  it("pads tag number to 4 digits", () => {
    expect(generateProvisionalId("INC-001", 7)).toBe("INC-001-T0007");
  });
});
