import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseEmail } from "@/lib/auth/validate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseEmail(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const origin = process.env.NEXT_PUBLIC_URL ?? req.nextUrl.origin;

  // The email link routes through /auth/confirm with ?next=/reset so the user
  // lands on the password-form UI (built in Plan 05) with a live session.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.value.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset`,
  });

  if (error) {
    console.error("[auth/reset-request] error", error.message);
    // Still return 200 — do not leak whether the email exists.
  }

  return NextResponse.json({ ok: true });
}
