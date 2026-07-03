import { describe, it, expect } from "vitest";
import { isValidSimulation } from "./validate-simulation";

const goodScenario = { tag: "Likely", title: "You stay", probability: 55 };
const good = {
  scenarios: [goodScenario],
  most_likely: "x",
  recommendation: "Take it.",
  reasoning: "y",
};

describe("isValidSimulation", () => {
  it("accepts a well-formed result", () => {
    expect(isValidSimulation(good)).toBe(true);
  });

  it("rejects null / non-object", () => {
    expect(isValidSimulation(null)).toBe(false);
    expect(isValidSimulation("nope")).toBe(false);
  });

  it("rejects a missing/blank recommendation", () => {
    expect(isValidSimulation({ ...good, recommendation: undefined })).toBe(false);
  });

  it("rejects missing or empty scenarios", () => {
    expect(isValidSimulation({ ...good, scenarios: undefined })).toBe(false);
    expect(isValidSimulation({ ...good, scenarios: [] })).toBe(false);
  });

  it("rejects a scenario with a non-finite/non-number probability", () => {
    expect(
      isValidSimulation({ ...good, scenarios: [{ tag: "Likely", title: "t", probability: Number.NaN }] }),
    ).toBe(false);
    expect(
      isValidSimulation({ ...good, scenarios: [{ tag: "Likely", title: "t", probability: "55" }] }),
    ).toBe(false);
  });

  it("rejects a scenario that is not an object", () => {
    expect(isValidSimulation({ ...good, scenarios: [null] })).toBe(false);
  });
});
