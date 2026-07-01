"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [demoNote, setDemoNote] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setDemoNote(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.demo) {
        setDemoNote("Stripe keys not configured — running in demo mode.");
        setTimeout(() => setDemoNote(null), 3500);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setDemoNote("Billing portal unavailable. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={go}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110 hover:shadow-[0_10px_60px_-5px_rgba(168,85,247,0.9)] disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {demoNote && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-border-hi bg-surface/95 px-3 py-2 text-center text-xs text-fg-soft backdrop-blur">
          {demoNote}
        </div>
      )}
    </div>
  );
}
