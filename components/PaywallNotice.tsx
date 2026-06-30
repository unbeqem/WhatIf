"use client";

import Link from "next/link";
import UpgradeButton from "@/components/UpgradeButton";

type Props = { limit: "anon_daily" | "free_daily" };

export default function PaywallNotice({ limit }: Props) {
  const isAnon = limit === "anon_daily";
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-glow">
        Soft paywall
      </div>
      <div className="mt-1 font-display text-xl leading-tight">
        {isAnon
          ? "You've used your free simulation for today."
          : "You've used your daily simulation."}
      </div>
      <p className="mt-2 text-sm text-fg-soft">
        {isAnon
          ? "Create a free account to keep simulating tomorrow, or go Pro for unlimited simulations now."
          : "Pro unlocks unlimited simulations, deeper second-order effects, and decision history."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {!isAnon && (
          <div className="flex-1">
            <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
          </div>
        )}
        {isAnon && (
          <Link
            href="/signup"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-magenta px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)]"
          >
            Create free account
          </Link>
        )}
        <Link
          href="/#pricing"
          className="inline-flex items-center justify-center rounded-xl border border-border-hi bg-bg/40 px-4 py-3 text-sm text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
        >
          Compare plans
        </Link>
      </div>
    </div>
  );
}
