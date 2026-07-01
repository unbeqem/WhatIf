import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Client surfaces (nav, result upsell) need the viewer's plan, which lives
// server-side in `profiles`. This is the single read they poll on mount.
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ configured: false, authenticated: false, email: null, plan: null });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return NextResponse.json({ configured: true, authenticated: false, email: null, plan: null });
  }

  let plan = "free";
  if (supabaseAdmin) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    plan = profile?.plan ?? "free";
  }

  return NextResponse.json({
    configured: true,
    authenticated: true,
    email: user.email ?? null,
    plan,
  });
}
