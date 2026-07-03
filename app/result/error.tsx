"use client";

import Link from "next/link";
import { useEffect } from "react";

// Route-level safety net: if anything in the /result tree throws at render time,
// the user sees an actionable fallback instead of a blank page.
export default function ResultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[result] render error", error);
  }, [error]);

  return (
    <div className="mx-auto mt-24 max-w-2xl px-6">
      <div className="rounded-3xl border border-border bg-surface/40 p-12 text-center">
        <h2 className="font-display text-3xl">Something glitched showing that.</h2>
        <p className="mt-3 text-fg-soft">
          Not your fault — the result couldn&apos;t be rendered. Try again, it usually works.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-border-hi bg-surface/60 px-5 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-hi"
          >
            Retry
          </button>
          <Link
            href="/decision"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)]"
          >
            New simulation →
          </Link>
        </div>
      </div>
    </div>
  );
}
