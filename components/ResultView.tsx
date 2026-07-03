"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import UpgradeButton from "@/components/UpgradeButton";
import ShareCard from "@/components/ShareCard";
import { useMe, isSubscriberPlan } from "@/lib/useMe";
import type { SimulationResult, Scenario, LockedInsight } from "@/lib/types";

type Stored = { input: string; result: SimulationResult; ts: number };

const TAG_STYLES: Record<string, { ring: string; bar: string; chip: string; label: string }> = {
  "Best Case": {
    ring: "from-cyan to-violet",
    bar: "from-cyan to-cyan-glow",
    chip: "text-cyan-glow border-cyan/30 bg-cyan/10",
    label: "Best Case",
  },
  Likely: {
    ring: "from-violet to-magenta",
    bar: "from-violet to-violet-glow",
    chip: "text-violet-glow border-violet/30 bg-violet/10",
    label: "Likely",
  },
  "Worst Case": {
    ring: "from-magenta to-amber",
    bar: "from-magenta to-amber",
    chip: "text-magenta border-magenta/30 bg-magenta/10",
    label: "Worst Case",
  },
};

function styleFor(tag: string) {
  return TAG_STYLES[tag] ?? TAG_STYLES.Likely;
}

export default function ResultView() {
  const [data, setData] = useState<Stored | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const me = useMe();
  // Show the upsell only once we know the viewer is NOT a subscriber, so Pro/Creator
  // users never flash the "Unlock Pro" block. While loading (me undefined) it stays hidden.
  const showUpsell = me !== undefined && !isSubscriberPlan(me.plan);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = sessionStorage.getItem("whatif:last");
      if (raw) setData(JSON.parse(raw) as Stored);
    } catch {
      /* noop */
    }
  }, []);

  if (!hydrated) return null;

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface/40 p-12 text-center">
        <h2 className="font-display text-3xl">No simulation yet.</h2>
        <p className="mt-3 text-fg-soft">
          The oracle has nothing to show. Ask a question first.
        </p>
        <Link
          href="/decision"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)]"
        >
          Ask a question →
        </Link>
      </div>
    );
  }

  const { input, result } = data;
  const isDemo = Boolean(result.demo);

  return (
    <div className="space-y-12">
      {/* Question echo */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl border border-border bg-surface/40 p-6 md:p-8"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute">
            The question
          </span>
          {isDemo && (
            <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber">
              Demo mode — no OpenAI key
            </span>
          )}
        </div>
        <p className="font-display text-2xl italic leading-snug md:text-3xl">"{input}"</p>
      </motion.div>

      {/* Scenarios */}
      <div>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-3xl md:text-4xl">Three futures</h2>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-fg-mute">
            {result.scenarios.length} scenarios
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {result.scenarios.map((s, i) => (
            <ScenarioCard key={i} scenario={s} idx={i} />
          ))}
        </div>
      </div>

      {/* Most likely */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl border border-border bg-surface/40 p-7 md:p-10"
      >
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-glow">
          Most likely trajectory
        </div>
        <p className="font-display text-xl leading-relaxed text-fg md:text-2xl">
          {result.most_likely}
        </p>
      </motion.div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 via-surface/60 to-cyan/5 p-7 md:p-10"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" />

        <div className="relative">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-violet-glow">
            The recommendation
          </div>
          <p className="font-display text-3xl leading-tight text-fg md:text-4xl">
            {result.recommendation}
          </p>
          <div className="mt-6 border-t border-border-hi/40 pt-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute">
              Reasoning
            </div>
            <p className="text-fg-soft">{result.reasoning}</p>
          </div>
        </div>
      </motion.div>

      {/* The held-back insight — revealed for subscribers, blurred paywall for everyone else */}
      {result.locked_insight && (
        <LockedInsightBlock insight={result.locked_insight} locked={showUpsell} />
      )}

      {/* Actions + Share/Creator export */}
      <div className={`grid gap-4 ${me ? "md:grid-cols-2" : ""}`}>
        <Link
          href="/decision"
          className="group inline-flex items-center justify-between rounded-2xl border border-border bg-surface/40 p-5 transition-colors hover:border-border-hi hover:bg-surface-hi"
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-mute">
              New
            </div>
            <div className="mt-1 font-display text-xl">Ask another question</div>
          </div>
          <span className="text-fg-mute transition-transform group-hover:translate-x-1 group-hover:text-fg">
            →
          </span>
        </Link>

        <ShareCard input={input} result={result} me={me} />
      </div>
    </div>
  );
}

function LockedInsightBlock({
  insight,
  locked,
}: {
  insight: LockedInsight;
  locked: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl border border-amber/40 bg-gradient-to-br from-amber/10 via-surface/60 to-magenta/5 p-7 md:p-10"
    >
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
        The part most people miss
      </div>

      <div
        className={locked ? "pointer-events-none select-none blur-[9px]" : ""}
        aria-hidden={locked}
      >
        <p className="font-display text-3xl leading-tight text-fg md:text-4xl">
          {insight.headline}
        </p>
        <p className="mt-4 text-fg-soft">{insight.detail}</p>
      </div>

      {locked && (
        <div className="absolute inset-0 grid place-items-center bg-bg/30 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm text-center">
            <div className="font-display text-2xl leading-tight">
              The version of this answer{" "}
              <span className="italic text-fg-soft">we held back</span>.
            </div>
            <p className="mt-2 text-sm text-fg-soft">
              Unlock the second-order insight most people in your position miss — plus history of
              every decision you simulate.
            </p>
            <div className="mx-auto mt-5 max-w-xs space-y-2">
              <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
              <Link
                href="/#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-border-hi bg-bg/40 px-4 py-2.5 text-sm text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
              >
                Compare plans
              </Link>
              <p className="text-[11px] text-fg-mute">
                Testphase · Zahlungen im Testmodus, keine echte Abbuchung
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ScenarioCard({ scenario, idx }: { scenario: Scenario; idx: number }) {
  const st = styleFor(scenario.tag);
  const pct = Math.max(0, Math.min(100, Math.round(scenario.probability ?? 0)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + idx * 0.12, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-bg-soft/60 p-6"
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${st.ring}`} />

      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${st.chip}`}>
          {st.label}
        </span>
        <span className="font-mono text-xs text-fg-mute">{pct}%</span>
      </div>

      <h3 className="font-display text-2xl leading-tight">{scenario.title}</h3>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-bg/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay: 0.4 + idx * 0.12, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${st.bar} shadow-[0_0_12px_rgba(192,132,252,0.5)]`}
        />
      </div>

      <div className="mt-5 space-y-4 text-sm leading-relaxed text-fg-soft">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-mute">
            Short term
          </div>
          <p>{scenario.short_term}</p>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-mute">
            Long term
          </div>
          <p>{scenario.long_term}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface/40 p-3">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-magenta">
            Key risk
          </div>
          <p>{scenario.key_risk}</p>
        </div>
      </div>
    </motion.div>
  );
}
