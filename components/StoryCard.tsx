import type { SimulationResult } from "@/lib/types";

type TagStyle = { chip: string; bar: string };

const TAG_STYLES: Record<string, TagStyle> = {
  "Best Case": { chip: "#67e8f9", bar: "linear-gradient(90deg,#22d3ee,#67e8f9)" },
  Likely: { chip: "#c084fc", bar: "linear-gradient(90deg,#a855f7,#c084fc)" },
  "Worst Case": { chip: "#ec4899", bar: "linear-gradient(90deg,#ec4899,#fbbf24)" },
};

function styleFor(tag: string): TagStyle {
  return TAG_STYLES[tag] ?? TAG_STYLES.Likely;
}

type Props = { input: string; result: SimulationResult };

export default function StoryCard({ input, result }: Props) {
  const scenarios = result.scenarios.slice(0, 3);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#07060d",
        backgroundImage:
          "radial-gradient(circle at 85% 8%, rgba(168,85,247,0.22), transparent 55%), radial-gradient(circle at 8% 10%, rgba(34,211,238,0.14), transparent 50%), radial-gradient(circle at 50% 95%, rgba(236,72,153,0.12), transparent 55%)",
        padding: 96,
        color: "#f5f3ff",
        fontFamily: "Inter",
        justifyContent: "space-between",
      }}
    >
      {/* Header band */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundImage: "linear-gradient(135deg,#a855f7,#ec4899,#22d3ee)",
              boxShadow: "0 0 40px rgba(192,132,252,0.5)",
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 600, color: "#ffffff" }}>?</span>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: "#f5f3ff" }}>
            What<span style={{ color: "#c084fc" }}>If</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 28,
            letterSpacing: 4,
            color: "#7d7aa3",
            fontFamily: "Inter",
            fontWeight: 600,
          }}
        >
          AI DECISION SIMULATION
        </div>
      </div>

      {/* Question block */}
      <div
        style={{
          display: "-webkit-box",
          fontFamily: "Instrument Serif",
          fontSize: 68,
          lineHeight: 1.1,
          color: "#f5f3ff",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4,
          overflow: "hidden",
        } as React.CSSProperties}
      >
        {`“${input}”`}
</div>

      {/* Three futures */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {scenarios.map((s, i) => {
          const st = styleFor(s.tag);
          const rawPct = Number(s.probability);
          const pct = Math.max(0, Math.min(100, Math.round(Number.isFinite(rawPct) ? rawPct : 0)));
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: 24,
                    letterSpacing: 2,
                    color: st.chip,
                    textTransform: "uppercase",
                  }}
                >
                  {s.tag}
                </div>
                <div style={{ display: "flex", fontFamily: "Instrument Serif", fontSize: 40, color: "#f5f3ff" }}>
                  {pct}%
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: "#271f4a",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${pct}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundImage: st.bar,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  color: "#c9c6e6",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {s.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation strip */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 3,
            color: "#c084fc",
            textTransform: "uppercase",
          }}
        >
          THE CALL
        </div>
        <div
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
            fontFamily: "Instrument Serif",
            fontSize: 44,
            lineHeight: 1.2,
            color: "#f5f3ff",
          } as React.CSSProperties}
        >
          {result.recommendation}
        </div>
      </div>

      {/* Footer band */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 28,
          color: "#c9c6e6",
        }}
      >
        whatif.app — simulate your decision
      </div>
    </div>
  );
}
