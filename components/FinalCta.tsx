"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe, isSubscriberPlan } from "@/lib/useMe";

// Plan-aware final CTA copy. New/free/anonymous visitors (and the brief loading
// window) see the "first simulation is free" framing; a subscriber who has
// already run a simulation this session sees neutral "run another" copy — the
// "first question" hint is redundant for them.
export default function FinalCta() {
  const me = useMe();
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    try {
      setHasAsked(!!sessionStorage.getItem("whatif:last"));
    } catch {
      setHasAsked(false);
    }
  }, []);

  const returning = me !== undefined && isSubscriberPlan(me.plan) && hasAsked;

  return (
    <>
      <p className="mx-auto mt-6 max-w-xl text-fg-soft">
        {returning
          ? "Take the next one you've been carrying — and see what it actually leads to."
          : "Take the one you've been carrying — and see what it actually leads to. The first one is free."}
      </p>
      <Link
        href="/decision"
        className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet via-violet to-magenta px-8 py-4 text-base font-semibold text-white shadow-[0_10px_60px_-10px_rgba(168,85,247,0.9)] transition-all hover:brightness-110"
      >
        {returning ? "Run another simulation" : "Start your first simulation"}
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </>
  );
}
