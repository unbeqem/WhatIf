"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setHydrated(true);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setHydrated(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await fetch("/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (!hydrated) return null;
  if (!isSupabaseConfigured) return null;

  if (!email) {
    return (
      <Link
        href="/login"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-hi bg-surface/60 px-4 py-2 text-sm font-medium text-fg-soft backdrop-blur-sm transition-all hover:border-violet-glow/60 hover:bg-surface-hi hover:text-fg"
      >
        Sign in
      </Link>
    );
  }

  const short = email.length > 22 ? email.slice(0, 20) + "…" : email;

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Link
        href="/account"
        title={email}
        className="inline-flex items-center gap-2 rounded-full border border-border-hi bg-surface/60 px-4 py-2 text-sm font-medium text-fg-soft backdrop-blur-sm transition-all hover:border-violet-glow/60 hover:bg-surface-hi hover:text-fg"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_6px_rgba(192,132,252,0.7)]" />
        {short}
      </Link>
      <button
        type="button"
        onClick={logout}
        aria-label="Sign out"
        title="Sign out"
        className="grid h-9 w-9 place-items-center rounded-full border border-border-hi bg-surface/60 text-fg-mute backdrop-blur-sm transition-colors hover:border-magenta/50 hover:text-magenta"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" x2="3" y1="12" y2="12" />
        </svg>
      </button>
    </div>
  );
}
