"use client";

import UpgradeButton from "@/components/UpgradeButton";
import { useMe } from "@/lib/useMe";
import type { Plan } from "@/lib/stripe";

const RANK = { free: 0, pro: 1, creator: 2 } as const;

// Plan-aware pricing CTA for the landing page. Anonymous/free viewers (and the
// brief loading window) see the normal checkout button; subscribers see a
// non-clickable state for the tier they already have (or that's included in a
// higher tier they hold), and a real upgrade button only for genuine upgrades.
export default function PricingCta({ plan, label }: { plan: Plan; label: string }) {
  const me = useMe();

  if (me === undefined || !me.authenticated || !me.plan || me.plan === "free") {
    return <UpgradeButton plan={plan}>{label}</UpgradeButton>;
  }

  const current = RANK[me.plan];
  const target = RANK[plan];

  if (current < target) {
    return <UpgradeButton plan={plan}>{label}</UpgradeButton>;
  }

  const text = current === target ? "Current plan" : "Included in your plan";
  return (
    <div
      aria-disabled="true"
      className="inline-flex w-full cursor-default items-center justify-center gap-2 rounded-xl border border-border-hi bg-surface/60 px-5 py-3 text-sm font-semibold text-fg-soft"
    >
      {text}
    </div>
  );
}
