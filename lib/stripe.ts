import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

const stripe = secret ? new Stripe(secret) : null;

export const stripeIsLive = Boolean(stripe);

export type Plan = "pro" | "creator";

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

export async function createCheckoutSession(plan: Plan): Promise<{ url: string; demo: boolean }> {
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
