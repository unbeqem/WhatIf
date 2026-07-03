import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCredentials } from "@/lib/auth/validate";
import { interpretAuthError } from "@/lib/auth/error-map";

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
  const { error } = await supabase.auth.signInWithPassword(parsed.value);

  if (error) {
    const mapped = interpretAuthError(error);
    // Unconfirmed email is a common real cause — tell the user precisely.
    if (mapped.code === "email_not_confirmed") {
      return NextResponse.json({ error: "email_not_confirmed" }, { status: mapped.status });
    }
    if (mapped.code === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    // Bad creds (Supabase 400) normalize to 401.
    if (mapped.code === "invalid_credentials") {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    console.error("[auth/login] error", error.status, error.code, error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
