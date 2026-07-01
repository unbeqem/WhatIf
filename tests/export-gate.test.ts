import { describe, expect, it } from "vitest";
import { exportGateDecision, isValidExportPayload } from "@/lib/export-gate";

const validScenario = { tag: "Likely", title: "You stay", probability: 55 };
const validResult = { recommendation: "Take the offer.", scenarios: [validScenario] };
const validInput = "Should I take the new job?";

describe("isValidExportPayload", () => {
  it("accepts a well-formed payload", () => {
    expect(isValidExportPayload(validInput, validResult)).toBe(true);
  });

  it("rejects input shorter than the minimum", () => {
    expect(isValidExportPayload("hi", validResult)).toBe(false);
  });

  it("rejects a non-string input", () => {
    expect(isValidExportPayload(123, validResult)).toBe(false);
  });

  it("rejects a null/non-object result", () => {
    expect(isValidExportPayload(validInput, null)).toBe(false);
    expect(isValidExportPayload(validInput, "nope")).toBe(false);
  });

  it("rejects a result missing recommendation", () => {
    expect(isValidExportPayload(validInput, { scenarios: [validScenario] })).toBe(false);
  });

  it("rejects an empty scenarios array", () => {
    expect(isValidExportPayload(validInput, { recommendation: "x".repeat(10), scenarios: [] })).toBe(false);
  });

  it("rejects a scenario that is not an object (CR-01 crash path)", () => {
    expect(
      isValidExportPayload(validInput, { recommendation: "Take it.", scenarios: [5, null] }),
    ).toBe(false);
  });

  it("rejects a non-finite / non-number probability (CR-01 NaN% path)", () => {
    expect(
      isValidExportPayload(validInput, {
        recommendation: "Take it.",
        scenarios: [{ tag: "Likely", title: "t", probability: {} }],
      }),
    ).toBe(false);
    expect(
      isValidExportPayload(validInput, {
        recommendation: "Take it.",
        scenarios: [{ tag: "Likely", title: "t", probability: Number.NaN }],
      }),
    ).toBe(false);
  });
});

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
