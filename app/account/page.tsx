import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import UpgradeButton from "@/components/UpgradeButton";
import ManageSubscriptionButton from "./ManageSubscriptionButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = {
  title: "Your account — WhatIf",
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  creator: "Creator",
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    redirect("/login");
  }

  let plan: string = "free";
  let stripeCustomerId: string | null = null;

  if (supabaseAdmin) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    plan = profile?.plan ?? "free";
    stripeCustomerId = profile?.stripe_customer_id ?? null;
  }

  const isSubscriber = plan === "pro" || plan === "creator" || Boolean(stripeCustomerId);

  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 md:pt-16">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-3.5 py-1.5 text-xs text-fg-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]" />
              <span className="font-mono uppercase tracking-[0.18em]">Your account</span>
            </div>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Manage your <span className="gradient-text">plan</span>.
            </h1>
          </div>

          <div className="rounded-2xl border border-border-hi bg-surface/60 p-6 backdrop-blur-sm md:p-8">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-fg-mute">Email</span>
                <span className="text-sm font-medium text-fg">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-mute">Current plan</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-hi bg-surface-hi px-3 py-1 text-sm font-semibold text-fg">
                  {PLAN_LABEL[plan] ?? "Free"}
                </span>
              </div>
            </div>

            {isSubscriber ? (
              <ManageSubscriptionButton />
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-fg-soft">
                  You&apos;re on the free plan. Unlock more simulations and history.
                </p>
                <UpgradeButton plan="pro">Unlock Pro — €5/mo</UpgradeButton>
                <UpgradeButton plan="creator">Go Creator — €9/mo</UpgradeButton>
                <p className="mt-2 text-center text-[11px] text-fg-mute">
                  Testphase · Zahlungen im Testmodus, keine echte Abbuchung
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
