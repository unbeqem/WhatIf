import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

export const stripe = secret
  ? new Stripe(secret, { apiVersion: "2024-12-18.acacia" })
  : null;

export const stripeIsLive = Boolean(stripe);

export type Plan = "pro" | "creator";
export type PlanTier = "free" | "pro" | "creator";
export type Interval = "month" | "year";

// Monthly billing anchors the price; annual is discounted (~2 months free).
const PLANS: Record<
  Plan,
  { name: string; description: string; prices: Record<Interval, number> }
> = {
  pro: {
    name: "WhatIf Pro",
    description: "Unlimited simulations, deeper scenarios, simulation history.",
    prices: { month: 500, year: 4000 },
  },
  creator: {
    name: "WhatIf Creator",
    description: "Everything in Pro + shareable story cards and TikTok export.",
    prices: { month: 900, year: 7900 },
  },
};

// One-time "deep dive" — unlock the full breakdown of a single decision without
// committing to a subscription. Captures the impulse buyer at the emotional peak.
export const DEEP_DIVE = {
  name: "WhatIf — Deep Dive on this decision",
  description: "Unlock the full breakdown of this one decision. One-time, no subscription.",
  amount: 300,
};

export function planPrice(plan: Plan, interval: Interval): number {
  return PLANS[plan].prices[interval];
}

export async function createCheckoutSession(
  plan: Plan,
  opts?: { userId?: string; email?: string; interval?: Interval },
): Promise<{ url: string; demo: boolean }> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const cfg = PLANS[plan];
  const interval: Interval = opts?.interval === "year" ? "year" : "month";

  if (!stripe) {
    return {
      demo: true,
      url: `${baseUrl}/?demo_checkout=${plan}&interval=${interval}`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: opts?.email,
    client_reference_id: opts?.userId,
    // metadata.plan is the source of truth for tier — amount alone is ambiguous
    // once annual pricing exists (annual Pro > monthly Creator).
    subscription_data: { metadata: { plan, userId: opts?.userId ?? "" } },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: cfg.name,
            description: cfg.description,
          },
          unit_amount: cfg.prices[interval],
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/decision?upgraded=1`,
    cancel_url: `${baseUrl}/?canceled=1`,
  });

  return { url: session.url ?? `${baseUrl}/`, demo: false };
}

export async function createDeepDiveSession(
  opts?: { userId?: string; email?: string },
): Promise<{ url: string; demo: boolean }> {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  if (!stripe) {
    return { demo: true, url: `${baseUrl}/result?unlocked=demo` };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: opts?.email,
    client_reference_id: opts?.userId,
    metadata: { kind: "deepdive", userId: opts?.userId ?? "" },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: DEEP_DIVE.name, description: DEEP_DIVE.description },
          unit_amount: DEEP_DIVE.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/result?unlocked=1`,
    cancel_url: `${baseUrl}/result`,
  });

  return { url: session.url ?? `${baseUrl}/result`, demo: false };
}

// Resolve tier: trust the plan we stamped on the subscription metadata at
// checkout; fall back to amount only if metadata is somehow missing.
export function planFromSubscription(sub: Stripe.Subscription): "pro" | "creator" {
  const metaPlan = sub.metadata?.plan;
  if (metaPlan === "creator" || metaPlan === "pro") return metaPlan;
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
