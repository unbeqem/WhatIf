import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/db.types";
import type { SimulationResult } from "@/lib/types";

const SUMMARY_MAX = 280;
const LIST_LIMIT = 50;

export type SimulationRecord = {
  id: string;
  input: string;
  result: SimulationResult;
  summary: string | null;
  created_at: string;
};

/**
 * Persist one accepted simulation for a subscriber. Service-role insert (RLS is
 * read-only). Skips demo fallbacks. Swallows errors — never block the response
 * on a history write, same discipline as logUsage.
 */
export async function saveSimulation(args: {
  userId: string;
  input: string;
  result: SimulationResult;
}): Promise<void> {
  if (!supabaseAdmin) return; // demo mode
  if (args.result.demo) return; // don't persist canned demo output

  const summary = args.result.most_likely
    ? args.result.most_likely.slice(0, SUMMARY_MAX)
    : null;

  const { error } = await supabaseAdmin.from("simulations").insert({
    user_id: args.userId,
    input: args.input,
    result: args.result as unknown as Json,
    summary,
  });
  if (error) {
    console.error("[history] save insert error", error.message);
  }
}

/** Newest-first history for a user (cap LIST_LIMIT). */
export async function listSimulations(userId: string): Promise<SimulationRecord[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("simulations")
    .select("id, input, result, summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("[history] list error", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    input: r.input,
    result: r.result as unknown as SimulationResult,
    summary: r.summary,
    created_at: r.created_at,
  }));
}
