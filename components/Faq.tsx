"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "Is my decision private?",
    a: "We store your email and a subscription reference, nothing else. Your decision text is sent to the model to generate the simulation and is not saved to a profile or used for training.",
  },
  {
    q: "How accurate are the probabilities?",
    a: "WhatIf is a decision-thinking tool, not a fortune teller. The three futures and probabilities are AI projections to widen your perspective — the final call is always yours.",
  },
  {
    q: "Can I cancel or get a refund?",
    a: "Cancel anytime from your account in two clicks; you keep access until the period ends. No lock-in, no hidden tiers.",
  },
  {
    q: "You're in the EU — who do I contact about my data?",
    a: (
      <>
        We're an EU-based operation and GDPR-compliant. Email data requests (access, deletion) to{" "}
        <a href="mailto:business@what-if.tech" className="text-violet-glow underline underline-offset-2 hover:text-fg">
          business@what-if.tech
        </a>{" "}
        and we'll action them.
      </>
    ),
  },
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border/60 rounded-2xl border border-border bg-surface/40">
      {ITEMS.map((item, i) => {
        const isOpen = openIdx === i;
        const panelId = `faq-panel-${i}`;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
            >
              <span className="font-display text-xl leading-tight">{item.q}</span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 text-fg-mute transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen &&
                (reducedMotion ? (
                  <div id={panelId} className="px-5 pb-5 text-sm leading-relaxed text-fg-soft md:text-base">
                    {item.a}
                  </div>
                ) : (
                  <motion.div
                    id={panelId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm leading-relaxed text-fg-soft md:text-base">
                      {item.a}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
