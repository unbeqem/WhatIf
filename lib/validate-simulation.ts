import type { SimulationResult } from "./types";

// Shared, dependency-free guard used on BOTH the server (after LLM JSON.parse) and
// the client (before storing/redirecting). The model returns JSON, but not always
// the shape we expect — an unvalidated result reaches /result and crashes
// `scenarios.map`, blanking the page. This is the single source of "is renderable".
export function isValidSimulation(r: unknown): r is SimulationResult {
  if (typeof r !== "object" || r === null) return false;
  const o = r as Record<string, unknown>;
  if (typeof o.recommendation !== "string") return false;
  if (!Array.isArray(o.scenarios) || o.scenarios.length === 0) return false;
  return o.scenarios.every((s) => {
    if (typeof s !== "object" || s === null) return false;
    const sc = s as Record<string, unknown>;
    return (
      typeof sc.title === "string" &&
      typeof sc.tag === "string" &&
      typeof sc.probability === "number" &&
      Number.isFinite(sc.probability)
    );
  });
}
