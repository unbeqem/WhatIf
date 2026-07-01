import { NextRequest, NextResponse } from "next/server";
import { stripe, planForEvent } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Demo-mode invariant (PROJECT.md): never 500 when keys are absent.
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  const raw = await req.text(); // RAW body — never req.json() (breaks signature)
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe:webhook] bad signature", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object; // Stripe.Checkout.Session
        const userId = s.client_reference_id;
        const customerId = s.customer as string;
        const subId = s.subscription as string;
        if (userId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const plan = planForEvent(event.type, sub); // "pro"|"creator"|"free"|null
          if (plan && supabaseAdmin) {
            await supabaseAdmin
              .from("profiles")
              .update({
                plan,
                stripe_customer_id: customerId,
                stripe_subscription_id: subId,
              })
              .eq("id", userId);
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object; // Stripe.Subscription
        const plan = planForEvent(event.type, sub);
        if (plan && supabaseAdmin) {
          // Subscription events lack client_reference_id — resolve via customer id.
          await supabaseAdmin
            .from("profiles")
            .update({ plan })
            .eq("stripe_customer_id", sub.customer as string);
        }
        break;
      }
      default:
        break; // ignore other event types
    }
  } catch (err) {
    console.error("[stripe:webhook] handler error", err);
    // Return 200 so Stripe does not hammer retries on our own bug; log for inspection.
    return NextResponse.json({ received: true, handled: false });
  }

  return NextResponse.json({ received: true });
}
