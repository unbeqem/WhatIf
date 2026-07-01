"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import PaywallNotice from "@/components/PaywallNotice";

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
  const taRef = useRef<HTMLTextAreaElement>(null);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim().length < 8) {
      setError("Give the oracle a real sentence to work with.");
      return;
    }
    setError(null);
    setPaywall(null);
    setLoading(true);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 && data.error === "limit_reached") {
          setPaywall(data.limit === "free_daily" ? "free_daily" : "anon_daily");
          setLoading(false);
          return;
        }
        if (res.status === 429 && data.error === "rate_limited") {
          setError(
            `Too many requests. Try again in ${data.retryAfterSec ?? 60}s.`,
          );
          setLoading(false);
          return;
        }
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      sessionStorage.setItem(
        "whatif:last",
        JSON.stringify({ input, result: data, ts: Date.now() }),
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
            <div className="relative rounded-3xl border border-border bg-surface/40 p-2 transition-colors focus-within:border-violet-glow/60">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What decision are you carrying? Be specific — names, numbers, stakes."
                rows={5}
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
                  <span>Simulate</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
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
