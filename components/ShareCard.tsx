"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import type { Me } from "@/lib/useMe";
import type { SimulationResult } from "@/lib/types";

type Props = {
  input: string;
  result: SimulationResult;
  me: Me | undefined;
  className?: string;
};

export default function ShareCard({ input, result, me, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me === undefined) return null;

  const isCreator = me.plan === "creator";

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      if (!res.ok) {
        setError("Couldn't render the card. Try again in a moment.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "whatif-simulation.png";
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Couldn't render the card. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-violet-glow/40 bg-gradient-to-br from-violet/15 to-surface/60 p-5 ${className ?? ""}`}>
      <div className="font-display text-xl">
        {isCreator ? "Turn this into content." : "Share your result."}
      </div>
      <p className="mt-2 text-sm text-fg-soft">
        {isCreator
          ? "Export a clean 9:16 card for TikTok, Reels, or Stories."
          : "Download a 9:16 card for TikTok, Reels, or Stories."}
      </p>
      <div className="mt-4">
        <button
          onClick={download}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Rendering your card…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download story card
            </>
          )}
        </button>
      </div>
      {saved && (
        <p className="mt-3 text-xs text-cyan-glow">Saved — check your downloads</p>
      )}
      {error && <p className="mt-3 text-xs text-magenta">{error}</p>}

      {!isCreator && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-xs text-fg-soft">
            Your card carries a small WhatIf badge.{" "}
            <Link href="/#pricing" className="text-violet-glow underline-offset-2 hover:underline">
              Go Creator
            </Link>{" "}
            for a clean, unbranded export.
          </p>
        </div>
      )}
    </div>
  );
}
