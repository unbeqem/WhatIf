import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePassword } from "@/lib/auth/validate";
import { interpretAuthError } from "@/lib/auth/error-map";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = parsePassword(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_input", field: parsed.field }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.value.password });
  if (error) {
    const mapped = interpretAuthError(error);
    if (mapped.code === "weak_password") {
      return NextResponse.json(
        { error: "weak_password", message: mapped.message },
        { status: mapped.status },
      );
    }
    if (mapped.code === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("[auth/reset-confirm] error", error.status, error.code, error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
