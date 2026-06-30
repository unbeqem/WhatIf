import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import ResultView from "@/components/ResultView";

export const metadata = {
  title: "The simulation — WhatIf",
};

export default function ResultPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-10 md:pt-16">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow shadow-[0_0_8px_2px_rgba(103,232,249,0.7)]" />
              <span className="font-mono uppercase tracking-[0.18em]">Step 2 — The oracle speaks</span>
            </div>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">
              Here are{" "}
              <span className="gradient-text">three versions</span>{" "}
              of your future.
            </h1>
          </div>

          <ResultView />
        </div>
      </section>
      <Footer />
    </>
  );
}
