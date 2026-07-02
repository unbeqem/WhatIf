import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import UpgradeButton from "@/components/UpgradeButton";
import HistoryEntry from "@/components/HistoryEntry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { listSimulations } from "@/lib/history";

export const metadata = {
  title: "Your history — WhatIf",
};

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    redirect("/login");
  }

  let plan = "free";
  if (supabaseAdmin) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    plan = profile?.plan ?? "free";
  }
  const isSubscriber = plan === "pro" || plan === "creator";

  const entries = isSubscriber ? await listSimulations(user.id) : [];

  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 md:pt-16">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]" />
              <span className="font-mono uppercase tracking-[0.18em]">Your history</span>
            </div>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Every decision you&apos;ve <span className="gradient-text">simulated</span>.
            </h1>
          </div>

          {!isSubscriber ? (
            <div className="rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-8 text-center backdrop-blur-sm">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-glow">
                Pro feature
              </div>
              <p className="mt-3 font-display text-2xl leading-tight">
                Your history is saved on Pro.
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-fg-soft">
                Upgrade and every simulation you run is kept here — revisit the
                futures and recommendations any time.
              </p>
              <div className="mx-auto mt-6 max-w-xs space-y-3">
                <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
                <p className="text-[11px] text-fg-mute">
                  Testphase · Zahlungen im Testmodus, keine echte Abbuchung
                </p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-border-hi bg-surface/60 p-8 text-center backdrop-blur-sm">
              <p className="font-display text-2xl">Nothing here yet.</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-fg-soft">
                Your simulations will show up here as you run them.
              </p>
              <div className="mt-6">
                <Link
                  href="/decision"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110"
                >
                  Run a simulation
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
