import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type Plan } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan?: Plan };
    const target: Plan = plan === "creator" ? "creator" : "pro";

    let userId: string | undefined;
    let email: string | undefined;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.auth.getUser();
        userId = data?.user?.id ?? undefined;
        email = data?.user?.email ?? undefined;
      } catch (e) {
        console.error("[stripe] auth.getUser error", e);
      }
    }

    const { url, demo } = await createCheckoutSession(target, { userId, email });
    return NextResponse.json({ url, demo });
  } catch (err) {
    console.error("[stripe] error", err);
    return NextResponse.json(
      { error: "Checkout unavailable." },
      { status: 500 },
    );
  }
}
