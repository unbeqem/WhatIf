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
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/40 px-3.5 py-2 text-sm text-fg-soft transition-colors hover:border-violet-glow/40 hover:text-fg"
      >
        Sign in
      </Link>
    );
  }

  const short = email.length > 22 ? email.slice(0, 20) + "…" : email;

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="rounded-full border border-border-hi bg-surface/60 px-3 py-1.5 text-xs text-fg-soft">
        {short}
      </span>
      <button
        type="button"
        onClick={logout}
        className="text-xs text-fg-mute transition-colors hover:text-fg"
      >
        Logout
      </button>
    </div>
  );
}
