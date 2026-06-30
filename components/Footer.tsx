export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-bg/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-fg-mute md:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-glow shadow-[0_0_8px_2px_rgba(192,132,252,0.7)]" />
          <span>WhatIf — the oracle is in beta.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="transition-colors hover:text-fg">Privacy</a>
          <a href="#" className="transition-colors hover:text-fg">Terms</a>
          <a href="mailto:hello@whatif.app" className="transition-colors hover:text-fg">Contact</a>
        </div>
      </div>
    </footer>
  );
}
