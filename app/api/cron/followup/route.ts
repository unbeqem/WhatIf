import { NextRequest, NextResponse } from "next/server";
import { runFollowUps } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Invoked on a schedule (Vercel Cron — see vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project.
// Without a secret configured we treat the endpoint as disabled (no-op), so it
// can never be abused or fire accidentally in demo/local.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, disabled: true, reason: "no_cron_secret" });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runFollowUps();
  return NextResponse.json({ ok: true, ...summary });
}
