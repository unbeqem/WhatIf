import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "WhatIf — Simulate your decision before you live it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [inter, serif] = await Promise.all([
    readFile(join(process.cwd(), "assets/Inter-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#07060d",
          backgroundImage:
            "radial-gradient(circle at 88% 6%, rgba(168,85,247,0.28), transparent 55%), radial-gradient(circle at 6% 12%, rgba(34,211,238,0.16), transparent 50%), radial-gradient(circle at 50% 100%, rgba(236,72,153,0.16), transparent 55%)",
          padding: 80,
          color: "#f5f3ff",
          fontFamily: "Inter",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundImage: "linear-gradient(135deg,#a855f7,#ec4899,#22d3ee)",
              boxShadow: "0 0 50px rgba(192,132,252,0.5)",
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 600, color: "#ffffff" }}>?</span>
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600 }}>
            What<span style={{ color: "#c084fc" }}>If</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 78,
              lineHeight: 1.05,
              color: "#f5f3ff",
            }}
          >
            Simulate your decision — before you live it.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#c9c6e6" }}>
            Three realistic futures, probabilities, and a sober recommendation.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 3,
            color: "#7d7aa3",
          }}
        >
          what-if.tech
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter, weight: 600, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
      ],
    },
  );
}
