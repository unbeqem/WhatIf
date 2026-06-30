import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type Plan } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan?: Plan };
    const target: Plan = plan === "creator" ? "creator" : "pro";
    const { url, demo } = await createCheckoutSession(target);
    return NextResponse.json({ url, demo });
  } catch (err) {
    console.error("[stripe] error", err);
    return NextResponse.json(
      { error: "Checkout unavailable." },
      { status: 500 },
    );
  }
}
