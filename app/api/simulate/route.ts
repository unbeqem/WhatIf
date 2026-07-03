import { NextRequest, NextResponse } from "next/server";
import { simulateDecision } from "@/lib/openai";
import { getAnonIdentity } from "@/lib/anon";
import { checkBurst } from "@/lib/ratelimit";
import { checkQuota, logUsage, resolveActor } from "@/lib/quota";
import { saveSimulation } from "@/lib/history";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DecisionContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_INPUT = 8;
const MAX_INPUT = 1500;
const CONTEXT_MAX = 60;

// Only accept the three known context fields, as trimmed short strings.
function sanitizeContext(raw: unknown): DecisionContext | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const pick = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, CONTEXT_MAX) : undefined;
  const ctx: DecisionContext = {
    ageRange: pick(r.ageRange),
    priority: pick(r.priority),
    riskTolerance: pick(r.riskTolerance),
  };
  return ctx.ageRange || ctx.priority || ctx.riskTolerance ? ctx : undefined;
}

export async function POST(req: NextRequest) {
  // -------- Step 0: parse + validate input (ABUSE-02) --------
  const body = await req.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input : "";
  const trimmedLen = input.trim().length;
  const context = sanitizeContext(body?.context);
  const refinement =
    typeof body?.refinement === "string" && body.refinement.trim()
      ? body.refinement.trim().slice(0, 500)
      : undefined;

  // Resolve identity now so we can log validation failures consistently.
  const anon = getAnonIdentity(req);

  // Optional: who's logged in? (works in demo mode -- returns null user)
  let supabaseUserId: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      supabaseUserId = data?.user?.id ?? null;
    } catch (e) {
      console.error("[simulate] auth.getUser error", e);
    }
  }
  const actor = await resolveActor(
    supabaseUserId ? { id: supabaseUserId } : null,
    anon.anonId,
  );

  function applyCookie(res: NextResponse) {
    if (anon.cookieToSet) {
      res.cookies.set(anon.cookieToSet.name, anon.cookieToSet.value, anon.cookieToSet.options);
    }
    return res;
  }

  // Refine & branch is a subscriber feature. Fail-open in demo mode (no Supabase),
  // consistent with the rest of the app.
  if (refinement) {
    const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSubscriber =
      actor.kind === "user" && (actor.plan === "pro" || actor.plan === "creator");
    if (!demoMode && !isSubscriber) {
      await logUsage({
        actor,
        ipHash: anon.ipHash,
        inputLength: input.length,
        blockedReason: "refine_requires_pro",
      });
      return applyCookie(
        NextResponse.json(
          { error: "upgrade_required", feature: "refine" },
          { status: 402 },
        ),
      );
    }
  }

  if (trimmedLen < MIN_INPUT) {
    await logUsage({
      actor,
      ipHash: anon.ipHash,
      inputLength: input.length,
      blockedReason: "input_too_short",
    });
    return applyCookie(
      NextResponse.json(
        { error: "Tell me a little more — at least a sentence." },
        { status: 400 },
      ),
    );
  }

  if (input.length > MAX_INPUT) {
    await logUsage({
      actor,
      ipHash: anon.ipHash,
      inputLength: input.length,
      blockedReason: "input_too_long",
    });
    return applyCookie(
      NextResponse.json(
        { error: "Decision is too long. Keep it under 1500 characters." },
        { status: 400 },
      ),
    );
  }

  // -------- Step 1: per-IP burst guard (ABUSE-01) --------
  const burst = await checkBurst(anon.ipHash);
  if (!burst.allowed) {
    await logUsage({
      actor,
      ipHash: anon.ipHash,
      inputLength: input.length,
      blockedReason: "burst",
    });
    const res = NextResponse.json(
      { error: "rate_limited", retryAfterSec: burst.retryAfterSec },
      { status: 429 },
    );
    res.headers.set("Retry-After", String(burst.retryAfterSec));
    return applyCookie(res);
  }

  // -------- Step 2: plan-aware daily quota (USAGE-01..03) --------
  const quota = await checkQuota(actor, anon.ipHash);
  if (!quota.allowed) {
    await logUsage({
      actor,
      ipHash: anon.ipHash,
      inputLength: input.length,
      blockedReason: quota.reason,
    });
    return applyCookie(
      NextResponse.json(
        { error: "limit_reached", limit: quota.reason },
        { status: 429 },
      ),
    );
  }

  // -------- Step 3: run the simulation --------
  try {
    const result = await simulateDecision(input, context, refinement);

    // -------- Step 4: log the accepted usage (counts toward 24h cap) --------
    await logUsage({
      actor,
      ipHash: anon.ipHash,
      inputLength: input.length,
      // no blockedReason -> counts toward quota
    });

    // -------- Step 5: persist history for subscribers (Pro feature) --------
    if (actor.kind === "user" && (actor.plan === "pro" || actor.plan === "creator")) {
      await saveSimulation({ userId: actor.userId, input, result });
    }

    return applyCookie(NextResponse.json(result));
  } catch (err) {
    console.error("[simulate] error", err);
    return applyCookie(
      NextResponse.json(
        { error: "The oracle is silent. Try again in a moment." },
        { status: 500 },
      ),
    );
  }
}
