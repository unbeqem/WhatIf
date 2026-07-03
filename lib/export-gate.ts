// Everyone can export a card — that IS the acquisition loop. Only Creator gets the
// clean, unbranded card; everyone else gets a watermarked one that advertises WhatIf.
export type ExportGate = { ok: true; watermark: boolean };

export const EXPORT_MIN_INPUT = 8;
export const EXPORT_MAX_INPUT = 1500;

// A scenario is only renderable if StoryCard can read its fields without producing
// NaN geometry. probability must be a finite number (not just `typeof number`, which
// admits NaN) — an object/null/NaN probability yields width:"NaN%" and crashes Satori.
function isRenderableScenario(s: unknown): boolean {
  if (typeof s !== "object" || s === null) return false;
  const sc = s as Record<string, unknown>;
  return (
    typeof sc.tag === "string" &&
    typeof sc.title === "string" &&
    typeof sc.probability === "number" &&
    Number.isFinite(sc.probability)
  );
}

// Full validation of the untrusted /api/export POST body. The endpoint is reachable by
// any authenticated Creator (and by anyone in demo mode), so a shape-valid but malformed
// payload must be rejected here, before it reaches ImageResponse.
export function isValidExportPayload(input: unknown, result: unknown): boolean {
  if (typeof input !== "string") return false;
  if (input.trim().length < EXPORT_MIN_INPUT || input.length > EXPORT_MAX_INPUT) return false;
  if (typeof result !== "object" || result === null) return false;
  const r = result as Record<string, unknown>;
  if (typeof r.recommendation !== "string") return false;
  if (!Array.isArray(r.scenarios) || r.scenarios.length === 0) return false;
  return r.scenarios.every(isRenderableScenario);
}

// demoMode === true means Supabase is unconfigured -> treat as creator (clean card) so
// marketing footage stays unbranded, per lib/quota fail-open discipline.
export function exportGateDecision(plan: string | null, demoMode: boolean): ExportGate {
  const clean = demoMode || plan === "creator";
  return { ok: true, watermark: !clean };
}
