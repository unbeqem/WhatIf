"use client";

import { motion } from "motion/react";

const scenarios = [
  {
    tag: "Best Case",
    color: "from-cyan to-violet",
    probability: 22,
    title: "The leap pays off",
    short:
      "Within 3 months you've doubled freelance income and you're sleeping better than you have in years.",
  },
  {
    tag: "Likely",
    color: "from-violet to-magenta",
    probability: 56,
    title: "Slower, messier, mostly fine",
    short:
      "You miss the structure for a quarter, course-correct, and by year two it just feels like the right call.",
  },
  {
    tag: "Worst Case",
    color: "from-magenta to-amber",
    probability: 22,
    title: "Cash runway runs out at month 5",
    short:
      "Without a 6-month buffer the financial stress eats the creative gains. Likely return to employment by month 9.",
  },
];

export default function DemoPreview() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur-sm md:p-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-magenta animate-pulse-glow" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-fg-mute">
            Live simulation
          </span>
        </div>

        <div className="mb-8 rounded-2xl border border-border-hi bg-bg/40 p-5 font-display text-2xl leading-snug md:text-3xl">
          <span className="text-fg-mute">Your question:</span>{" "}
          <span className="italic text-fg">Should I quit my job to freelance?</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-bg-soft/60 p-5"
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.color}`} />
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full border border-border-hi bg-surface px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-soft">
                  {s.tag}
                </span>
                <span className="font-mono text-xs text-fg-mute">{s.probability}%</span>
              </div>
              <h4 className="mb-2 font-display text-xl leading-tight text-fg">{s.title}</h4>
              <p className="text-sm leading-relaxed text-fg-soft">{s.short}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-violet/30 bg-gradient-to-br from-violet/10 to-cyan/5 p-5">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-violet-glow">
            Recommendation
          </div>
          <p className="text-pretty text-fg-soft">
            <span className="text-fg">Quit — but only if you have 6 months of runway.</span>{" "}
            Without it, the most likely path is a forced return at month 9 with momentum lost.
            The decision isn't quitting; it's whether you funded it first.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-violet/25 via-cyan/10 to-magenta/15 blur-2xl" />
    </div>
  );
}
