"use client";

import { motion, useReducedMotion } from "motion/react";
import { TrendingUp, Minus, TrendingDown, type LucideIcon } from "lucide-react";

type Row = { label: string; pct: number; icon: LucideIcon; bar: string; text: string };

const ROWS: Row[] = [
  { label: "Best case", pct: 24, icon: TrendingUp, bar: "from-cyan to-cyan-glow", text: "text-cyan-glow" },
  { label: "Likely", pct: 58, icon: Minus, bar: "from-violet to-violet-glow", text: "text-violet-glow" },
  { label: "Worst case", pct: 18, icon: TrendingDown, bar: "from-magenta to-amber", text: "text-magenta" },
];

// Decorative, non-interactive preview of a result — conveys the product at a glance.
export default function HeroPreview() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      aria-hidden
      className="mx-auto mt-14 w-full max-w-md rounded-3xl border border-border-hi bg-surface/40 p-6 text-left shadow-[0_30px_80px_-30px_rgba(168,85,247,0.5)] backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute">
          Three futures
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-glow">
          simulated
        </span>
      </div>
      <div className="space-y-4">
        {ROWS.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={r.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-sm ${r.text}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {r.label}
                </span>
                <span className="font-mono text-xs text-fg-mute">{r.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg/60">
                <motion.div
                  initial={{ width: reduce ? `${r.pct}%` : 0 }}
                  animate={{ width: `${r.pct}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.18, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${r.bar} shadow-[0_0_14px_rgba(192,132,252,0.5)]`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
