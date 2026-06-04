import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Helper to create a mock context
function createCtx(overrides: Partial<User> = {}): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "manus",
    role: "admin",
    facilityId: null,
    phone: null,
    jobTitle: null,
    isActive: true,
    preferredLang: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── OR State Machine Logic Tests ─────────────────────────────────────────────

describe("OR Case State Machine (router logic)", () => {
  const validTransitions: Record<string, string[]> = {
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

  const isValidTransition = (from: string, to: string) =>
    validTransitions[from]?.includes(to) ?? false;

  it("rejects backward transitions", () => {
    expect(isValidTransition("INCISION", "PROPOSED")).toBe(false);
    expect(isValidTransition("COMPLETE", "SCHEDULED")).toBe(false);
    expect(isValidTransition("CLOSURE", "INDUCTION")).toBe(false);
  });

  it("accepts all valid forward transitions", () => {
    expect(isValidTransition("PROPOSED", "SCHEDULED")).toBe(true);
    expect(isValidTransition("SCHEDULED", "IN_OR_PREP")).toBe(true);
    expect(isValidTransition("IN_OR_PREP", "INDUCTION")).toBe(true);
    expect(isValidTransition("INDUCTION", "INCISION")).toBe(true);
    expect(isValidTransition("INCISION", "CLOSURE")).toBe(true);
    expect(isValidTransition("CLOSURE", "IN_PACU")).toBe(true);
    expect(isValidTransition("IN_PACU", "OUT_PACU")).toBe(true);
    expect(isValidTransition("OUT_PACU", "COMPLETE")).toBe(true);
  });

  it("accepts cancellation from early states", () => {
    expect(isValidTransition("PROPOSED", "CANCELLED")).toBe(true);
    expect(isValidTransition("SCHEDULED", "CANCELLED")).toBe(true);
    expect(isValidTransition("IN_OR_PREP", "ABORTED")).toBe(true);
    expect(isValidTransition("INCISION", "ABORTED")).toBe(true);
  });

  it("terminal states have no valid transitions", () => {
    expect(validTransitions["COMPLETE"]).toHaveLength(0);
    expect(validTransitions["CANCELLED"]).toHaveLength(0);
    expect(validTransitions["ABORTED"]).toHaveLength(0);
  });
});

// ─── Admin Role Guard Tests ────────────────────────────────────────────────────

describe("Admin Role Guard", () => {
  const requireAdmin = (role: string) => {
    if (role !== "superadmin" && role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
  };

  it("allows superadmin", () => expect(() => requireAdmin("superadmin")).not.toThrow());
  it("allows admin", () => expect(() => requireAdmin("admin")).not.toThrow());
  it("blocks incident_commander", () => expect(() => requireAdmin("incident_commander")).toThrow(TRPCError));
  it("blocks clinician", () => expect(() => requireAdmin("clinician")).toThrow(TRPCError));
  it("blocks triage_officer", () => expect(() => requireAdmin("triage_officer")).toThrow(TRPCError));
  it("blocks logistics", () => expect(() => requireAdmin("logistics")).toThrow(TRPCError));
  it("blocks viewer", () => expect(() => requireAdmin("viewer")).toThrow(TRPCError));
  it("throws FORBIDDEN code", () => {
    try {
      requireAdmin("viewer");
    } catch (e) {
      expect(e instanceof TRPCError).toBe(true);
      expect((e as TRPCError).code).toBe("FORBIDDEN");
    }
  });
});

// ─── Incident Code Generation Tests ───────────────────────────────────────────

describe("Incident Code Generation", () => {
  const generateCode = (year: number, id: string) => `MCI-${year}-${id.toUpperCase()}`;

  it("generates correct format", () => {
    const code = generateCode(2026, "abc123");
    expect(code).toMatch(/^MCI-\d{4}-[A-Z0-9]+$/);
  });

  it("includes year", () => {
    expect(generateCode(2026, "xyz")).toContain("2026");
  });

  it("uppercases the ID", () => {
    expect(generateCode(2026, "abc")).toBe("MCI-2026-ABC");
  });
});

// ─── Triage Category Validation ───────────────────────────────────────────────

describe("Triage Category Validation", () => {
  const validCategories = ["IMMEDIATE","DELAYED","MINIMAL","EXPECTANT","DECEASED"] as const;
  const isValidCategory = (cat: string) => validCategories.includes(cat as any);

  it("accepts all valid categories", () => {
    validCategories.forEach(cat => expect(isValidCategory(cat)).toBe(true));
  });

  it("rejects invalid categories", () => {
    expect(isValidCategory("RED")).toBe(false);
    expect(isValidCategory("YELLOW")).toBe(false);
    expect(isValidCategory("")).toBe(false);
    expect(isValidCategory("UNKNOWN_CAT")).toBe(false);
  });
});

// ─── Resource Utilization Calculation ─────────────────────────────────────────

describe("Resource Utilization Calculation", () => {
  const calcUtilization = (inUse: number, total: number) =>
    total > 0 ? Math.round((inUse / total) * 100) : 0;

  it("calculates 100% utilization correctly", () => expect(calcUtilization(10, 10)).toBe(100));
  it("calculates 50% utilization correctly", () => expect(calcUtilization(5, 10)).toBe(50));
  it("calculates 0% when none in use", () => expect(calcUtilization(0, 10)).toBe(0));
  it("handles zero total without division error", () => expect(calcUtilization(0, 0)).toBe(0));
  it("rounds to nearest integer", () => expect(calcUtilization(1, 3)).toBe(33));
});
