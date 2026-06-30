import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && ALLOWED_OTP_TYPES.has(value as EmailOtpType);
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash =
    url.searchParams.get("token_hash") ?? url.searchParams.get("token");
  const typeParam = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", url.origin));
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  // Reject external + protocol-relative redirects (W2).
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const successUrl =
    target === "/"
      ? new URL("/?confirmed=1", url.origin)
      : new URL(target, url.origin);

  const supabase = await createSupabaseServerClient();

  // Strategy: prefer the OTP/token_hash flow (resilient to cookie loss across the
  // email-click cross-origin redirect). Fall back to PKCE exchangeCodeForSession
  // only when no token_hash is present.
  if (tokenHash && isOtpType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam,
      token_hash: tokenHash,
    });
    if (error) {
      console.error("[auth/confirm] verifyOtp error", error.message);
      return NextResponse.redirect(
        new URL("/login?error=confirmation_failed", url.origin),
      );
    }
    return NextResponse.redirect(successUrl);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/confirm] exchangeCodeForSession error", error.message);
      return NextResponse.redirect(
        new URL("/login?error=confirmation_failed", url.origin),
      );
    }
    return NextResponse.redirect(successUrl);
  }

  return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
}
