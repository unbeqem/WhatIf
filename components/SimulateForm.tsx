"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import PaywallNotice from "@/components/PaywallNotice";
import UpgradeButton from "@/components/UpgradeButton";
import { useMe, isSubscriberPlan } from "@/lib/useMe";

const EXAMPLES = [
  "Should I quit my stable job to go all-in on my side project?",
  "Should I move across the world for someone I've known six months?",
  "Should I end a five-year relationship that's just… fine?",
  "Should I take the €40k offer or counter and risk losing it?",
  "Should I have a kid this year or wait two more?",
  "Should I drop out to build this, or finish the degree?",
  "Should I cut off a family member for my own sanity?",
  "Should I sink my savings into this apartment or keep renting?",
];

const AGE_OPTIONS = ["18–24", "25–34", "35–44", "45+"];
const PRIORITY_OPTIONS = ["Money", "Freedom", "Relationships", "Growth", "Stability"];
const RISK_OPTIONS = ["Play it safe", "Balanced", "Go for it"];

const ORACLE_PHASES = [
  "Reading the question…",
  "Projecting short-term effects…",
  "Modeling second-order consequences…",
  "Weighing probabilities…",
  "Drafting the recommendation…",
];

export default function SimulateForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<"anon_daily" | "free_daily" | null>(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [riskTolerance, setRiskTolerance] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareUpsell, setCompareUpsell] = useState(false);
  const [inputB, setInputB] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const me = useMe();
  const isSubscriber = me !== undefined && isSubscriberPlan(me.plan);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!loading) return;
    setPhaseIdx(0);
    const id = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % ORACLE_PHASES.length);
    }, 1400);
    return () => clearInterval(id);
  }, [loading]);

  type RunResult =
    | { kind: "ok"; data: unknown }
    | { kind: "limit"; limit: "free_daily" | "anon_daily" }
    | { kind: "rate"; sec: number }
    | { kind: "error"; msg: string };

  async function runOne(text: string): Promise<RunResult> {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, context: { ageRange, priority, riskTolerance } }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.error === "limit_reached") {
        return { kind: "limit", limit: data.limit === "free_daily" ? "free_daily" : "anon_daily" };
      }
      if (res.status === 429 && data.error === "rate_limited") {
        return { kind: "rate", sec: data.retryAfterSec ?? 60 };
      }
      return { kind: "error", msg: data.error ?? "Something went wrong. Try again." };
    }
    return { kind: "ok", data: await res.json() };
  }

  function applyFail(r: Exclude<RunResult, { kind: "ok" }>) {
    if (r.kind === "limit") setPaywall(r.limit);
    else if (r.kind === "rate") setError(`Too many requests. Try again in ${r.sec}s.`);
    else setError(r.msg);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (compareMode) return submitCompare();

    if (input.trim().length < 8) {
      setError("Give the oracle a real sentence to work with.");
      return;
    }
    setError(null);
    setPaywall(null);
    setLoading(true);

    try {
      const r = await runOne(input);
      if (r.kind !== "ok") return applyFail(r);
      sessionStorage.setItem(
        "whatif:last",
        JSON.stringify({ input, result: r.data, ts: Date.now() }),
      );
      router.push("/result");
    } catch {
      setError("Connection failed. Check your network and try again.");
      setLoading(false);
    }
  }

  async function submitCompare() {
    if (input.trim().length < 8 || inputB.trim().length < 8) {
      setError("Give both paths a real sentence to work with.");
      return;
    }
    setError(null);
    setPaywall(null);
    setLoading(true);

    try {
      const a = await runOne(input);
      if (a.kind !== "ok") return applyFail(a);
      const b = await runOne(inputB);
      if (b.kind !== "ok") return applyFail(b);
      sessionStorage.setItem(
        "whatif:last",
        JSON.stringify({
          mode: "compare",
          ts: Date.now(),
          a: { input, result: a.data },
          b: { input: inputB, result: b.data },
        }),
      );
      router.push("/result");
    } catch {
      setError("Connection failed. Check your network and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative grid place-items-center rounded-3xl border border-border-hi bg-surface/40 p-12 md:p-20"
          >
            <OracleAnimation />
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="mt-8 font-mono text-sm uppercase tracking-[0.18em] text-fg-soft"
              >
                {ORACLE_PHASES[phaseIdx]}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {compareMode && (
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-glow">
                Path A
              </div>
            )}
            <div className="relative rounded-3xl border border-border bg-surface/40 p-2 transition-colors focus-within:border-violet-glow/60">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  compareMode
                    ? "The first path — e.g. 'Stay in my current job.'"
                    : "What decision are you carrying? Be specific — names, numbers, stakes."
                }
                rows={compareMode ? 3 : 5}
                maxLength={1500}
                className="block w-full resize-none rounded-2xl bg-transparent p-5 font-display text-2xl leading-snug text-fg placeholder:font-sans placeholder:text-base placeholder:text-fg-mute focus:outline-none md:text-3xl"
              />
              <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                <span className="font-mono text-xs text-fg-mute">
                  {input.length} / 1500
                </span>
                <button
                  type="submit"
                  className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet via-violet to-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.85)] transition-all hover:brightness-110 hover:shadow-[0_12px_50px_-8px_rgba(168,85,247,1)]"
                >
                  <span>{compareMode ? "Compare paths" : "Simulate"}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>

            {compareMode && (
              <>
                <div className="mb-2 mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-magenta">
                  Path B
                </div>
                <div className="relative rounded-3xl border border-border bg-surface/40 p-2 transition-colors focus-within:border-magenta/60">
                  <textarea
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    placeholder="The other path — e.g. 'Quit and freelance full-time.'"
                    rows={3}
                    maxLength={1500}
                    className="block w-full resize-none rounded-2xl bg-transparent p-5 font-display text-2xl leading-snug text-fg placeholder:font-sans placeholder:text-base placeholder:text-fg-mute focus:outline-none md:text-3xl"
                  />
                  <div className="border-t border-border/60 px-4 py-3">
                    <span className="font-mono text-xs text-fg-mute">{inputB.length} / 1500</span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriber) {
                    setCompareUpsell(true);
                    return;
                  }
                  setCompareMode((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-mute transition-colors hover:text-fg-soft"
              >
                <span>{compareMode ? "−" : "+"}</span>
                Compare two paths — Pro
              </button>
              {compareUpsell && !isSubscriber && (
                <div className="mt-3 rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-4">
                  <p className="text-sm text-fg-soft">
                    Simulate two options at once — stay vs. quit, this city vs. that — side by side.
                    A Pro feature.
                  </p>
                  <div className="mt-3 max-w-xs">
                    <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-mute transition-colors hover:text-fg-soft"
              >
                <span>{showContext ? "−" : "+"}</span>
                Add context — sharper answer (optional)
              </button>

              <AnimatePresence initial={false}>
                {showContext && (
                  <motion.div
                    key="context"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-surface/30 p-4">
                      <ChipRow label="Your age" options={AGE_OPTIONS} value={ageRange} onSelect={setAgeRange} />
                      <ChipRow label="What matters most right now" options={PRIORITY_OPTIONS} value={priority} onSelect={setPriority} />
                      <ChipRow label="Risk appetite" options={RISK_OPTIONS} value={riskTolerance} onSelect={setRiskTolerance} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta">
                {error}
              </div>
            )}

            {paywall && <PaywallNotice limit={paywall} />}

            <div className="mt-8">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-mute">
                Need a starting point? Try one of these.
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setInput(ex);
                      taRef.current?.focus();
                    }}
                    className="rounded-full border border-border bg-surface/30 px-3.5 py-1.5 text-xs text-fg-soft transition-all hover:border-violet-glow/50 hover:bg-surface-hi hover:text-fg"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChipRow({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-mute">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(active ? null : opt)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                active
                  ? "border-violet-glow/60 bg-violet/20 text-fg"
                  : "border-border bg-surface/30 text-fg-soft hover:border-violet-glow/40 hover:text-fg"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OracleAnimation() {
  return (
    <div className="relative h-32 w-32">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet via-magenta to-cyan opacity-70 blur-2xl animate-pulse-glow" />
      <div className="absolute inset-3 rounded-full border border-violet-glow/40" />
      <div
        className="absolute inset-6 rounded-full border border-cyan-glow/40"
        style={{ animation: "orbit 8s linear infinite" }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-5xl text-glow">?</span>
      </div>
    </div>
  );
}
