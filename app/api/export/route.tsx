import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { exportGateDecision } from "@/lib/export-gate";
import StoryCard from "@/components/StoryCard";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_INPUT = 8;
const MAX_INPUT = 1500;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input : "";
  const trimmedLen = input.trim().length;
  const result = body?.result;

  if (
    trimmedLen < MIN_INPUT ||
    input.length > MAX_INPUT ||
    typeof result?.recommendation !== "string" ||
    !Array.isArray(result?.scenarios)
  ) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  let plan: string | null = null;

  if (!demoMode) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    plan = "free";
    if (supabaseAdmin) {
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();
        plan = profile?.plan ?? "free";
      }
    }
  }

  const gate = exportGateDecision(plan, demoMode);
  if (!gate.ok) {
    return NextResponse.json(gate.body, { status: gate.status });
  }

  const [inter, serif] = await Promise.all([
    readFile(join(process.cwd(), "assets/Inter-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")),
  ]);

  return new ImageResponse(<StoryCard input={input} result={result} />, {
    width: 1080,
    height: 1920,
    fonts: [
      { name: "Inter", data: inter, weight: 600, style: "normal" },
      { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
    ],
    headers: {
      "Content-Disposition": 'attachment; filename="whatif-simulation.png"',
    },
  });
}
