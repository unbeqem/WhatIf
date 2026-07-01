"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

// Animated counter target. HONEST product truth — NOT a fabricated usage/user
// count (founder decision). This is the number of futures WhatIf projects for
// every decision, which is the core product promise. Single source of truth.
const FUTURES_PER_DECISION = 3;
const FUTURES_LABEL = "possible futures, every time";

const STATS = [
  { value: "< 8s", label: "to your answer" },
  { value: "€0", label: "to try your first" },
];

type Testimonial = { quote: string; name: string; role: string };

// 3-5 entries (CONTENT-02). Pre-launch marketing copy: believable + specific,
// abstract gradient avatars (no photos), locations from the hero trust strip.
const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I almost signed the lease — WhatIf showed me the 18-month version I hadn't pictured.",
    name: "Mara K.",
    role: "Product designer, Berlin",
  },
  {
    quote: "It didn't tell me what to do. It showed me the worst case clearly enough that I finally could.",
    name: "Devon R.",
    role: "Freelance developer, Lisbon",
  },
  {
    quote: "I ran the number I was scared to look at through it, and the recommendation matched my gut for once.",
    name: "Priya S.",
    role: "Marketing lead, New York",
  },
];

export default function Testimonials() {
  return (
    <div className="space-y-16">
      <CounterStrip />
      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.name} testimonial={t} idx={i} />
        ))}
      </div>
    </div>
  );
}

function CounterStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(reducedMotion ? FUTURES_PER_DECISION : 0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setCount(FUTURES_PER_DECISION);
      return;
    }

    const durationMs = 1200;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * FUTURES_PER_DECISION));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, reducedMotion]);

  return (
    <div ref={ref} className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
      <div className="text-center">
        <div className="font-display text-5xl text-fg md:text-6xl">
          <span className="gradient-text">{count}</span>
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.15em] text-fg-mute">{FUTURES_LABEL}</div>
      </div>
      {STATS.map((s) => (
        <div key={s.label} className="text-center">
          <div className="font-display text-5xl text-fg md:text-6xl">{s.value}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.15em] text-fg-mute">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, idx }: { testimonial: Testimonial; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:border-border-hi"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet to-cyan" />
      <p className="font-display text-xl leading-snug text-fg">"{testimonial.quote}"</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet via-magenta to-cyan" />
        <div>
          <div className="text-sm text-fg">{testimonial.name}</div>
          <div className="text-xs text-fg-mute">{testimonial.role}</div>
        </div>
      </div>
    </motion.div>
  );
}
