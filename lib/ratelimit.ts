import "server-only";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export type BurstResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

// Per-IP burst guard (ABUSE-01): at most 5 requests per rolling 60s window.
// Backed by Postgres rather than Redis — every /api/simulate request already
// writes exactly one simulation_usage row via logUsage, so a windowed COUNT by
// ip_hash is an accurate request counter without a second datastore. This runs
// BEFORE the current request is logged, so a prior count >= 5 rejects the 6th.
const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 5;

export async function checkBurst(ipHash: string): Promise<BurstResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { allowed: true }; // demo mode -- no DB configured
  }

  const sinceIso = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabaseAdmin
    .from("simulation_usage")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", sinceIso);

  if (error) {
    console.error("[ratelimit] burst count error", error.message);
    return { allowed: true }; // fail-open -- never break the loop on a DB hiccup
  }

  if ((count ?? 0) >= MAX_IN_WINDOW) {
    return { allowed: false, retryAfterSec: Math.ceil(WINDOW_MS / 1000) };
  }
  return { allowed: true };
}
