"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "whatif:demo-banner-dismissed";

// Slim, site-wide, dismissible notice that the site is in a test phase and
// payments run in Stripe test mode (no real charge). Shown on every page via
// the root layout. Dismissal persists in localStorage.
export default function DemoBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1") {
      setHidden(true);
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures (private mode etc.) — banner just reappears next load
    }
  }

  return (
    <div className="relative z-30 border-b border-border-hi bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-[11px] leading-snug text-fg-soft sm:text-xs">
        <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-violet to-magenta shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
        <span>
          Testphase · Zahlungen laufen im Testmodus – es wird nichts real abgebucht.
        </span>
        <button
          onClick={dismiss}
          aria-label="Hinweis schließen"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-mute transition-colors hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
