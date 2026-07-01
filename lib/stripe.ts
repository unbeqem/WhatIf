import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

export const stripe = secret
  ? new Stripe(secret, { apiVersion: "2024-12-18.acacia" })
  : null;

export const stripeIsLive = Boolean(stripe);

export type Plan = "pro" | "creator";
export type PlanTier = "free" | "pro" | "creator";

const PLANS: Record<Plan, { name: string; amount: number; description: string }> = {
  pro: {
    name: "WhatIf Pro",
    amount: 500,
    description: "Unlimited simulations, deeper scenarios, simulation history.",
  },
  creator: {
    name: "WhatIf Creator",
    amount: 900,
    description: "Everything in Pro + shareable story cards and TikTok export.",
  },
};

export async function createCheckoutSession(
  plan: Plan,
  opts?: { userId?: string; email?: string },
): Promise<{ url: string; demo: boolean }> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const cfg = PLANS[plan];

  if (!stripe) {
    return {
      demo: true,
      url: `${baseUrl}/?demo_checkout=${plan}`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: opts?.email,
    client_reference_id: opts?.userId,
    subscription_data: { metadata: { plan, userId: opts?.userId ?? "" } },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: cfg.name,
            description: cfg.description,
          },
          unit_amount: cfg.amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/decision?upgraded=1`,
    cancel_url: `${baseUrl}/?canceled=1`,
  });

  return { url: session.url ?? `${baseUrl}/`, demo: false };
}

// amount -> tier. Ties to PLANS above: pro=500, creator=900.
export function planFromSubscription(sub: Stripe.Subscription): "pro" | "creator" {
  const amount = sub.items.data[0]?.price.unit_amount ?? 0;
  return amount >= 900 ? "creator" : "pro";
}

// Pure reducer: given a subscription lifecycle object + event type, return the tier
// to WRITE, or null when the event should be ignored. STATUS-based entitlement
// (active/trialing keep the paid tier even if cancel_at_period_end=true;
// canceled/unpaid/incomplete_expired downgrade to free).
export function planForEvent(
  eventType: string,
  sub: Stripe.Subscription,
): PlanTier | null {
  if (eventType === "customer.subscription.deleted") return "free";
  if (
    eventType === "checkout.session.completed" ||
    eventType === "customer.subscription.updated"
  ) {
    const entitled = sub.status === "active" || sub.status === "trialing";
    return entitled ? planFromSubscription(sub) : "free";
  }
  return null;
}

export async function createPortalSession(customerId: string): Promise<string | null> {
  if (!stripe) return null; // demo mode
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/account`,
  });
  return session.url;
}
