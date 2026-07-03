import { describe, it, expect } from "vitest";
import { planFromSubscription, planForEvent } from "./stripe";
import type Stripe from "stripe";

function sub(opts: {
  amount?: number;
  status?: Stripe.Subscription.Status;
  cancelAtPeriodEnd?: boolean;
  metaPlan?: string;
}): Stripe.Subscription {
  return {
    status: opts.status ?? "active",
    cancel_at_period_end: opts.cancelAtPeriodEnd ?? false,
    metadata: opts.metaPlan ? { plan: opts.metaPlan } : {},
    items: {
      data:
        opts.amount === undefined
          ? []
          : [{ price: { unit_amount: opts.amount } }],
    },
  } as unknown as Stripe.Subscription;
}

describe("planFromSubscription", () => {
  it("maps unit_amount 500 to pro", () => {
    expect(planFromSubscription(sub({ amount: 500 }))).toBe("pro");
  });

  it("maps unit_amount 900 to creator", () => {
    expect(planFromSubscription(sub({ amount: 900 }))).toBe("creator");
  });

  it("maps unit_amount 1200 (>=900) to creator", () => {
    expect(planFromSubscription(sub({ amount: 1200 }))).toBe("creator");
  });

  it("falls back to pro when items/price is missing (unit_amount undefined -> 0)", () => {
    expect(planFromSubscription(sub({ amount: undefined }))).toBe("pro");
  });

  it("annual Pro (amount 4000) stays pro via metadata, not misclassified as creator", () => {
    expect(planFromSubscription(sub({ amount: 4000, metaPlan: "pro" }))).toBe("pro");
  });

  it("metadata plan wins over amount for creator too", () => {
    expect(planFromSubscription(sub({ amount: 7900, metaPlan: "creator" }))).toBe(
      "creator",
    );
  });
});

describe("planForEvent", () => {
  it("checkout.session.completed + active + amount 500 -> pro", () => {
    expect(
      planForEvent(
        "checkout.session.completed",
        sub({ status: "active", amount: 500 }),
      ),
    ).toBe("pro");
  });

  it("checkout.session.completed + active + amount 900 -> creator", () => {
    expect(
      planForEvent(
        "checkout.session.completed",
        sub({ status: "active", amount: 900 }),
      ),
    ).toBe("creator");
  });

  it("customer.subscription.updated + active + cancel_at_period_end true -> stays pro (Pattern 3)", () => {
    expect(
      planForEvent(
        "customer.subscription.updated",
        sub({ status: "active", amount: 500, cancelAtPeriodEnd: true }),
      ),
    ).toBe("pro");
  });

  it("customer.subscription.updated + trialing + amount 900 -> creator", () => {
    expect(
      planForEvent(
        "customer.subscription.updated",
        sub({ status: "trialing", amount: 900 }),
      ),
    ).toBe("creator");
  });

  it("customer.subscription.updated + canceled -> free", () => {
    expect(
      planForEvent(
        "customer.subscription.updated",
        sub({ status: "canceled" }),
      ),
    ).toBe("free");
  });

  it("customer.subscription.updated + unpaid -> free", () => {
    expect(
      planForEvent("customer.subscription.updated", sub({ status: "unpaid" })),
    ).toBe("free");
  });

  it("customer.subscription.deleted + any status -> free", () => {
    expect(
      planForEvent(
        "customer.subscription.deleted",
        sub({ status: "active", amount: 900 }),
      ),
    ).toBe("free");
  });

  it("unhandled event type (invoice.paid) -> null", () => {
    expect(planForEvent("invoice.paid", sub({ status: "active" }))).toBeNull();
  });
});
