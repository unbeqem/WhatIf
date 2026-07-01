export type ExportGate =
  | { ok: true }
  | {
      ok: false;
      status: 402;
      body: {
        error: "upgrade_required";
        plan: string;
        upsell: { target: "creator"; price: "€9/mo"; href: "/#pricing" };
      };
    };

// demoMode === true means Supabase is unconfigured -> allow (treat as creator), per lib/quota fail-open.
export function exportGateDecision(plan: string | null, demoMode: boolean): ExportGate {
  if (demoMode || plan === "creator") return { ok: true };
  return {
    ok: false,
    status: 402,
    body: {
      error: "upgrade_required",
      plan: plan ?? "free",
      upsell: { target: "creator", price: "€9/mo", href: "/#pricing" },
    },
  };
}
