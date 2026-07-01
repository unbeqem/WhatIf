import { describe, expect, it } from "vitest";
import { exportGateDecision } from "@/lib/export-gate";

describe("exportGateDecision", () => {
  it("allows creator plan", () => {
    expect(exportGateDecision("creator", false)).toEqual({ ok: true });
  });

  it("blocks free plan with 402 upsell", () => {
    const result = exportGateDecision("free", false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.body).toEqual({
        error: "upgrade_required",
        plan: "free",
        upsell: { target: "creator", price: "€9/mo", href: "/#pricing" },
      });
    }
  });

  it("blocks pro plan with 402", () => {
    const result = exportGateDecision("pro", false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.body.plan).toBe("pro");
    }
  });

  it("allows null plan when demoMode is true", () => {
    expect(exportGateDecision(null, true)).toEqual({ ok: true });
  });

  it("blocks null plan with plan 'free' when demoMode is false", () => {
    const result = exportGateDecision(null, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.body.plan).toBe("free");
      expect(result.body.upsell.target).toBe("creator");
      expect(result.body.upsell.href).toBe("/#pricing");
    }
  });
});
