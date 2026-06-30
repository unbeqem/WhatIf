import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import SimulateForm from "@/components/SimulateForm";

export const metadata = {
  title: "Ask the oracle — WhatIf",
  description: "Type the decision you're carrying. WhatIf will simulate three futures for it.",
};

export default function DecisionPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-10 md:pt-16">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]" />
              <span className="font-mono uppercase tracking-[0.18em]">Step 1 — Ask</span>
            </div>
            <h1 className="font-display text-4xl leading-tight text-balance md:text-6xl">
              What decision do you{" "}
              <span className="italic text-fg-soft">keep postponing</span>?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-fg-soft">
              Type it like you'd say it to a friend at 2am. The more specific you are, the sharper
              the simulation.
            </p>
          </div>

          <SimulateForm />

          <p className="mt-10 text-center text-xs text-fg-mute">
            WhatIf is a simulation, not advice. You're still the one steering.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
