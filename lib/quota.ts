import "server-only";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { PlanTier } from "@/lib/db.types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Actor =
  | { kind: "user"; userId: string; plan: PlanTier }
  | { kind: "anon"; anonId: string };

export type QuotaResult =
  | { allowed: true; actor: Actor }
  | { allowed: false; reason: "anon_daily" | "free_daily"; actor: Actor };

/**
 * Resolve the request actor. For logged-in users, fetches the plan from
 * `profiles`. Falls back to 'free' if the profile is missing (shouldn't
 * happen — the trigger creates it on signup — but be defensive).
 */
export async function resolveActor(
  supabaseUser: { id: string } | null,
  anonId: string,
): Promise<Actor> {
  if (!supabaseUser) {
    return { kind: "anon", anonId };
  }
  if (!supabaseAdmin) {
    return { kind: "user", userId: supabaseUser.id, plan: "free" };
  }
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", supabaseUser.id)
    .maybeSingle();
  return {
    kind: "user",
    userId: supabaseUser.id,
    plan: (data?.plan as PlanTier | undefined) ?? "free",
  };
}

/**
 * Plan-aware quota check.
 * - pro / creator -> always allowed (USAGE-03).
 * - free user    -> 1/24h, counted via simulation_usage rows where blocked_reason IS NULL.
 * - anon         -> 1/24h, counted via OR(anon_id, ip_hash) for the same window.
 */
export async function checkQuota(actor: Actor, ipHash: string): Promise<QuotaResult> {
  if (actor.kind === "user" && (actor.plan === "pro" || actor.plan === "creator")) {
    return { allowed: true, actor };
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { allowed: true, actor }; // demo mode -- no DB, allow
  }

  const sinceIso = new Date(Date.now() - DAY_MS).toISOString();

  if (actor.kind === "user") {
    const { count, error } = await supabaseAdmin
      .from("simulation_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", actor.userId)
      .is("blocked_reason", null)
      .gte("created_at", sinceIso);

    if (error) {
      console.error("[quota] free user count error", error.message);
      return { allowed: true, actor }; // fail-open: never break the loop on a DB hiccup
    }
    return (count ?? 0) >= 1
      ? { allowed: false, reason: "free_daily", actor }
      : { allowed: true, actor };
  }

  // anon: OR(anon_id, ip_hash)
  // SAFE INTERPOLATION: actor.anonId is a server-generated UUID (lib/anon.ts randomUUID)
  // and ipHash is a 64-char hex digest. Neither is user-controlled. Do NOT interpolate
  // any user input into the .or() filter string — PostgREST treats it as a query DSL.
  const { count, error } = await supabaseAdmin
    .from("simulation_usage")
    .select("id", { count: "exact", head: true })
    .or(`anon_id.eq.${actor.anonId},ip_hash.eq.${ipHash}`)
    .is("blocked_reason", null)
    .gte("created_at", sinceIso);

  if (error) {
    console.error("[quota] anon count error", error.message);
    return { allowed: true, actor };
  }
  return (count ?? 0) >= 1
    ? { allowed: false, reason: "anon_daily", actor }
    : { allowed: true, actor };
}

/**
 * Insert one row into simulation_usage. blocked_reason=undefined for accepted
 * simulations (counted toward quota), set for blocked ones (visible in
 * Supabase for ABUSE-03 review, not counted toward quota).
 */
export async function logUsage(args: {
  actor: Actor;
  ipHash: string;
  inputLength: number;
  blockedReason?: string;
}): Promise<void> {
  if (!supabaseAdmin) return; // demo mode

  const row: {
    user_id: string | null;
    anon_id: string | null;
    ip_hash: string;
    input_length: number;
    blocked_reason: string | null;
  } = {
    user_id: args.actor.kind === "user" ? args.actor.userId : null,
    anon_id: args.actor.kind === "anon" ? args.actor.anonId : null,
    ip_hash: args.ipHash,
    input_length: args.inputLength,
    blocked_reason: args.blockedReason ?? null,
  };

  const { error } = await supabaseAdmin.from("simulation_usage").insert(row);
  if (error) {
    console.error("[quota] log insert error", error.message);
    // Swallow -- never block the user response on a logging failure.
  }
}
