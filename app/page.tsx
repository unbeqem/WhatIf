import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import DemoPreview from "@/components/DemoPreview";
import UpgradeButton from "@/components/UpgradeButton";

const COUNTERS = [
  { value: "10,247", label: "decisions simulated" },
  { value: "3", label: "futures per question" },
  { value: "< 8s", label: "to your answer" },
];

const STEPS = [
  {
    n: "01",
    title: "Ask the question you've been avoiding",
    body: "Quit the job. End the relationship. Take the loan. Move countries. Type it in plain language.",
  },
  {
    n: "02",
    title: "The oracle simulates three futures",
    body: "Best case, most likely, worst case — with probabilities, timelines, and the second-order effects you weren't counting on.",
  },
  {
    n: "03",
    title: "Get a recommendation you can act on",
    body: "Not a horoscope. A clear call with reasoning, plus the kill-switch that protects you if reality diverges.",
  },
];

const TIERS = [
  {
    name: "Curious",
    price: "Free",
    cadence: "forever",
    blurb: "Test the oracle on one real decision a day.",
    features: ["1 simulation / day", "3 scenario futures", "Basic recommendation"],
    cta: { label: "Try it free", href: "/decision", primary: false },
  },
  {
    name: "Pro",
    price: "€5",
    cadence: "/ month",
    blurb: "For people facing big choices and tired of guessing.",
    features: [
      "Unlimited simulations",
      "Deeper second-order effects",
      "Save your decision history",
      "Compare scenarios side-by-side",
    ],
    cta: { label: "Go Pro", plan: "pro" as const, primary: true },
    highlight: true,
  },
  {
    name: "Creator",
    price: "€9",
    cadence: "/ month",
    blurb: "Pro + the toolkit to turn simulations into content.",
    features: [
      "Everything in Pro",
      "Shareable story cards",
      "9:16 TikTok-ready exports",
      "Custom viral templates",
    ],
    cta: { label: "Become a Creator", plan: "creator" as const, primary: false },
  },
];

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-glow" />
              </span>
              <span className="font-mono uppercase tracking-[0.18em]">The oracle is online</span>
            </div>

            <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl lg:text-[88px]">
              <span className="gradient-text">Let an AI</span>
              <br />
              simulate your decision —{" "}
              <em className="text-fg-soft">before</em>{" "}
              you live it.
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-fg-soft md:text-xl">
              WhatIf projects three realistic futures for any decision you're carrying. Quitting,
              moving, leaving, leaping — see how it plays out before you commit.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/decision"
                className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet via-violet to-magenta px-7 py-4 text-base font-semibold text-white shadow-[0_10px_60px_-15px_rgba(168,85,247,0.9)] transition-all hover:brightness-110 hover:shadow-[0_15px_80px_-10px_rgba(168,85,247,1)]"
              >
                <span className="relative z-10">Simulate my first decision</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
                <span className="pointer-events-none absolute inset-0 -z-0 rounded-2xl bg-gradient-to-br from-violet via-magenta to-cyan opacity-0 blur-md transition-opacity group-hover:opacity-70" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-2xl border border-border-hi bg-surface/40 px-6 py-4 text-base font-medium text-fg-soft backdrop-blur transition-colors hover:bg-surface-hi hover:text-fg"
              >
                See a live example
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {COUNTERS.map((c) => (
                <div key={c.label} className="text-center">
                  <div className="font-display text-3xl text-fg md:text-4xl">{c.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.15em] text-fg-mute">
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative mx-auto max-w-6xl px-6 pb-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-fg-mute">
            <span>As trusted by early users in</span>
            <span className="text-fg-soft">— Berlin</span>
            <span className="text-fg-soft">— New York</span>
            <span className="text-fg-soft">— London</span>
            <span className="text-fg-soft">— Lisbon</span>
            <span className="text-fg-soft">— Tokyo</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <div className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-violet-glow">
                The problem
              </div>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                You make the biggest choices of your life with{" "}
                <span className="italic text-fg-soft">gut, fear, or chance.</span>
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-fg-soft">
              <p>
                Career pivots. Moves. Breakups. Buying. Starting. Quitting. The choices that bend
                the trajectory of a decade — you make them in a coffee shop on a Tuesday.
              </p>
              <p>
                You list pros and cons. You ask a friend. You sleep on it. And then you guess.
              </p>
              <p className="text-fg">
                <span className="text-glow text-violet-glow">WhatIf shows you the futures</span> —
                three of them, with probabilities — so you can decide with sight instead of hope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-glow">
              How it works
            </div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              Three steps. Eight seconds.
            </h2>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-7 transition-colors hover:border-border-hi"
              >
                <div className="mb-5 font-mono text-xs text-fg-mute">{s.n}</div>
                <h3 className="mb-3 font-display text-2xl leading-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-fg-soft">{s.body}</p>
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-violet/15 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="relative">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-violet-glow">
              Live demo
            </div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              This is what an answer actually looks like.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-fg-soft">
              No horoscopes. No vague advice. Just a clean projection of how each path tends to
              play out for people in your situation.
            </p>
          </div>

          <div className="mt-14">
            <DemoPreview />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-glow">
              Pricing
            </div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">
              Buy back the choices you keep postponing.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-fg-soft">
              Less than a cheap dinner. The decision you're avoiding costs more.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative overflow-hidden rounded-3xl border p-7 transition-transform hover:-translate-y-1 ${
                  tier.highlight
                    ? "border-violet-glow/50 bg-gradient-to-b from-violet/12 to-surface/60 shadow-[0_30px_80px_-30px_rgba(168,85,247,0.6)]"
                    : "border-border bg-surface/50"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute right-5 top-5 rounded-full bg-violet/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-violet-glow">
                    Most popular
                  </div>
                )}
                <div className="mb-2 text-sm font-medium text-fg-soft">{tier.name}</div>
                <div className="mb-1 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl text-fg">{tier.price}</span>
                  <span className="text-sm text-fg-mute">{tier.cadence}</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-fg-soft">{tier.blurb}</p>

                <ul className="mb-7 space-y-3 text-sm text-fg-soft">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan shadow-[0_0_8px_rgba(192,132,252,0.7)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {"plan" in tier.cta ? (
                  <UpgradeButton plan={tier.cta.plan}>{tier.cta.label}</UpgradeButton>
                ) : (
                  <Link
                    href={tier.cta.href!}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border-hi bg-bg/60 px-5 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-hi"
                  >
                    {tier.cta.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-xs text-fg-mute">
            Cancel anytime. No hidden tiers. The oracle keeps no grudges.
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-36">
          <div className="relative overflow-hidden rounded-[2rem] border border-border-hi bg-gradient-to-br from-surface/80 via-bg-soft to-surface/40 p-10 text-center md:p-16">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-cyan/20 blur-3xl" />

            <p className="mx-auto max-w-2xl font-display text-3xl leading-tight md:text-5xl">
              Most bad decisions{" "}
              <span className="italic text-fg-soft">feel right</span> in the moment.
            </p>
            <p className="mx-auto mt-6 max-w-xl text-fg-soft">
              Take the one you've been carrying — and see what it actually leads to. The first one
              is free.
            </p>
            <Link
              href="/decision"
              className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet via-violet to-magenta px-8 py-4 text-base font-semibold text-white shadow-[0_10px_60px_-10px_rgba(168,85,247,0.9)] transition-all hover:brightness-110"
            >
              Start your first simulation
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
