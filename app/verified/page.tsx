"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";

const REDIRECT_DELAY_MS = 2800;

// Only allow same-origin relative paths (mirror the confirm route's redirect guard).
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/decision";
}

function VerifiedInner() {
  const router = useRouter();
  const params = useSearchParams();
  const failed = params.get("error") !== null;
  const next = safeNext(params.get("next"));
  const [seconds, setSeconds] = useState(Math.round(REDIRECT_DELAY_MS / 1000));

  useEffect(() => {
    if (failed) return;
    const redirect = setTimeout(() => router.replace(next), REDIRECT_DELAY_MS);
    const tick = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => {
      clearTimeout(redirect);
      clearInterval(tick);
    };
  }, [failed, next, router]);

  if (failed) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-magenta/40 bg-magenta/10">
          <AlertTriangle className="h-8 w-8 text-magenta" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl">Link expired</h1>
        <p className="mx-auto mt-4 max-w-sm text-fg-soft">
          This confirmation link is invalid or has already been used. Request a
          fresh one and try again.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110"
          >
            Get a new link
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border-hi bg-surface/40 px-5 py-3 text-sm text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-cyan-glow/40 bg-cyan/10">
        <CheckCircle2 className="h-8 w-8 text-cyan-glow" />
      </div>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-glow">
        You're in
      </div>
      <h1 className="font-display text-4xl md:text-5xl">Email verified</h1>
      <p className="mx-auto mt-4 max-w-sm text-fg-soft">
        Your account is active. Taking you to your first simulation in {seconds}s…
      </p>
      <Link
        href={next}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110"
      >
        Continue now
        <span>→</span>
      </Link>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-md px-6 pb-20 pt-16 md:pt-28">
          <div className="rounded-3xl border border-border bg-surface/40 p-8 md:p-10">
            <Suspense fallback={null}>
              <VerifiedInner />
            </Suspense>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
