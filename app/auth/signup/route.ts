import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCredentials } from "@/lib/auth/validate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parseCredentials(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const origin =
    process.env.NEXT_PUBLIC_URL ??
    req.nextUrl.origin;

  const { error } = await supabase.auth.signUp({
    email: parsed.value.email,
    password: parsed.value.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    if (error.status === 429) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("[auth/signup] error", error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, needsConfirmation: true });
}
