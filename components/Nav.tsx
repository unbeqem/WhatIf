"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#demo", label: "Demo" },
  { href: "/#pricing", label: "Pricing" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors ${
        scrolled || open
          ? "border-b border-border/60 bg-bg/75 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet via-magenta to-cyan shadow-[0_0_30px_-5px_rgba(192,132,252,0.7)]">
            <span className="text-[14px] font-bold leading-none text-white">?</span>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            What<span className="text-violet-glow">If</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-fg-soft md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/decision"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border-hi bg-surface/60 px-4 py-2 text-sm font-medium text-fg backdrop-blur-sm transition-all hover:border-violet-glow/60 hover:bg-surface-hi"
          >
            Try free
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border-hi bg-surface/60 text-fg-soft transition-colors hover:text-fg md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-4 bg-current transition-transform ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden border-t border-border/60 transition-[max-height,opacity] duration-300 ${
          open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2.5 text-fg-soft transition-colors hover:bg-surface-hi hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/decision"
            className="mt-1 inline-flex items-center justify-between rounded-lg bg-gradient-to-br from-violet to-magenta px-3 py-2.5 font-medium text-white"
          >
            Try free <span>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
