import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/confirm] exchange error", error.message);
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", url.origin));
  }

  // `next` lets reset-confirm flow redirect to /reset; default confirms email and lands on /.
  // Reject both external URLs (must start with "/") AND protocol-relative URLs ("//evil.com"
  // also starts with "/" but new URL() would resolve it off-origin) — W2 fix.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const successUrl = target === "/"
    ? new URL("/?confirmed=1", url.origin)
    : new URL(target, url.origin);
  return NextResponse.redirect(successUrl);
}
