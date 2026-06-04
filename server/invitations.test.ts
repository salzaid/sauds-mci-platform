import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Invite token generation ───────────────────────────────────────────────────

function generateToken(length = 48): string {
  // Simulate nanoid-style token
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildInviteUrl(origin: string, token: string): string {
  return `${origin}/invite/${token}`;
}

// ─── Invite expiry logic ───────────────────────────────────────────────────────

const INVITE_EXPIRY_DAYS = 7;

function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

function createExpiryDate(daysFromNow: number): Date {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

// ─── Invite status validation ──────────────────────────────────────────────────

type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

function canClaim(status: InviteStatus, expiresAt: Date): { ok: boolean; reason?: string } {
  if (status === "REVOKED") return { ok: false, reason: "Invitation has been revoked." };
  if (status === "ACCEPTED") return { ok: false, reason: "Invitation has already been accepted." };
  if (status === "EXPIRED" || isExpired(expiresAt)) return { ok: false, reason: "Invitation has expired." };
  if (status === "PENDING") return { ok: true };
  return { ok: false, reason: "Unknown status." };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Invite Token Generation", () => {
  it("generates a token of the correct length", () => {
    expect(generateToken(48)).toHaveLength(48);
    expect(generateToken(32)).toHaveLength(32);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken(48)));
    expect(tokens.size).toBe(100);
  });

  it("builds correct invite URL", () => {
    const url = buildInviteUrl("https://mci.example.com", "abc123token");
    expect(url).toBe("https://mci.example.com/invite/abc123token");
  });

  it("builds URL with any origin", () => {
    const url = buildInviteUrl("http://localhost:3000", "xyz");
    expect(url).toContain("/invite/xyz");
  });
});

describe("Invite Expiry Logic", () => {
  it("non-expired invite returns false", () => {
    const future = createExpiryDate(7);
    expect(isExpired(future)).toBe(false);
  });

  it("expired invite returns true", () => {
    const past = new Date(Date.now() - 1000);
    expect(isExpired(past)).toBe(true);
  });

  it("expiry date is 7 days from now", () => {
    const expiry = createExpiryDate(INVITE_EXPIRY_DAYS);
    const diff = expiry.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
  });
});

describe("Invite Claim Validation", () => {
  const futureExpiry = createExpiryDate(7);
  const pastExpiry = new Date(Date.now() - 1000);

  it("PENDING + valid expiry → can claim", () => {
    expect(canClaim("PENDING", futureExpiry)).toEqual({ ok: true });
  });

  it("REVOKED → cannot claim", () => {
    const result = canClaim("REVOKED", futureExpiry);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("revoked");
  });

  it("ACCEPTED → cannot claim", () => {
    const result = canClaim("ACCEPTED", futureExpiry);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already been accepted");
  });

  it("EXPIRED status → cannot claim", () => {
    const result = canClaim("EXPIRED", futureExpiry);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("PENDING but past expiry date → cannot claim", () => {
    const result = canClaim("PENDING", pastExpiry);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("expired");
  });
});

describe("Admin Role Guard for Invitations", () => {
  const requireAdmin = (role: string) => {
    if (role !== "superadmin" && role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
  };

  it("superadmin can manage invitations", () => expect(() => requireAdmin("superadmin")).not.toThrow());
  it("admin can manage invitations", () => expect(() => requireAdmin("admin")).not.toThrow());
  it("clinician cannot manage invitations", () => expect(() => requireAdmin("clinician")).toThrow(TRPCError));
  it("viewer cannot manage invitations", () => expect(() => requireAdmin("viewer")).toThrow(TRPCError));
  it("triage_officer cannot manage invitations", () => expect(() => requireAdmin("triage_officer")).toThrow(TRPCError));
});
