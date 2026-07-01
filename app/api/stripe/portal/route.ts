import { NextResponse } from "next/server";
import { stripe, createPortalSession } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  // Demo-mode invariant: no Stripe → do not 500; send them home with a notice flag.
  if (!stripe || !supabaseAdmin || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ demo: true, url: `${baseUrl}/account?portal=demo` });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  // IDOR mitigation: customer id comes from the CALLER'S OWN row, never the request.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    // Never checked out — nothing to manage. Point at pricing.
    return NextResponse.json({ url: `${baseUrl}/#pricing`, noCustomer: true });
  }

  const url = await createPortalSession(customerId);
  return NextResponse.json({ url: url ?? `${baseUrl}/account` });
}
