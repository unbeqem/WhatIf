"use client";

import { useRouter } from "next/navigation";
import type { SimulationRecord } from "@/lib/history";

// One saved decision. "View" rehydrates the stored result into the same
// sessionStorage slot SimulateForm uses, then opens /result — reusing ResultView
// whole rather than building a separate detail view.
export default function HistoryEntry({ entry }: { entry: SimulationRecord }) {
  const router = useRouter();

  function open() {
    try {
      sessionStorage.setItem(
        "whatif:last",
        JSON.stringify({ input: entry.input, result: entry.result, ts: Date.now() }),
      );
    } catch {
      // ignore storage failures — navigation below still degrades gracefully
    }
    router.push("/result");
  }

  const date = new Date(entry.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={open}
      className="group w-full rounded-2xl border border-border bg-surface/40 p-5 text-left transition-colors hover:border-border-hi hover:bg-surface-hi"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute">
          {date}
        </span>
        <span className="text-fg-mute transition-transform group-hover:translate-x-1 group-hover:text-fg">
          →
        </span>
      </div>
      <div className="mt-2 font-display text-lg leading-snug text-fg">
        {entry.input}
      </div>
      {entry.summary && (
        <p className="mt-2 line-clamp-2 text-sm text-fg-soft">{entry.summary}</p>
      )}
    </button>
  );
}
