export default function BackgroundOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-violet/30 blur-3xl animate-float-slow" />
      <div
        className="absolute -top-10 right-[-100px] h-[420px] w-[420px] rounded-full bg-cyan/25 blur-3xl animate-float-slow"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute top-[40%] left-[30%] h-[360px] w-[360px] rounded-full bg-magenta/20 blur-3xl animate-float-slow"
        style={{ animationDelay: "-3s" }}
      />
    </div>
  );
}
