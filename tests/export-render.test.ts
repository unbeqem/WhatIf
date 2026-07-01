import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";
import StoryCard from "@/components/StoryCard";
import type { SimulationResult } from "@/lib/types";

const sampleResult: SimulationResult = {
  scenarios: [
    {
      title: "You take the leap",
      tag: "Best Case",
      probability: 40,
      short_term: "Rocky first months.",
      long_term: "Thriving independent business.",
      key_risk: "Runway.",
    },
    {
      title: "Steady but slower",
      tag: "Likely",
      probability: 45,
      short_term: "Mixed income.",
      long_term: "Modest growth.",
      key_risk: "Burnout.",
    },
    {
      title: "It doesn't work out",
      tag: "Worst Case",
      probability: 15,
      short_term: "Financial strain.",
      long_term: "Return to employment.",
      key_risk: "Savings depleted.",
    },
  ],
  most_likely: "You keep both going for a while.",
  recommendation: "Take the leap, but keep six months of runway.",
  reasoning: "The downside is recoverable; the upside compounds.",
};

describe("app/api/export/route.tsx contract", () => {
  const routeSource = readFileSync(
    join(process.cwd(), "app/api/export/route.tsx"),
    "utf8",
  );

  it("declares the nodejs runtime", () => {
    expect(routeSource).toMatch(/runtime = "nodejs"/);
  });

  it("caps render duration at 30s", () => {
    expect(routeSource).toMatch(/maxDuration = 30/);
  });

  it("renders a 1080x1920 ImageResponse", () => {
    expect(routeSource).toMatch(/width: 1080/);
    expect(routeSource).toMatch(/height: 1920/);
  });
});

describe("StoryCard", () => {
  it("renders without throwing given a sample SimulationResult", () => {
    const element = StoryCard({ input: "Should I quit my job?", result: sampleResult });
    expect(element).toBeTruthy();
  });
});

// Real Satori rasterization guard (EXPORT-01/02). This is the check that catches
// layout errors like a non-flex <div> with multiple children — the static
// "renders without throwing" test above cannot, since it never rasterizes.
describe("StoryCard rasterization", () => {
  async function rasterize(input: string, result: SimulationResult) {
    const [inter, serif] = await Promise.all([
      readFile(join(process.cwd(), "assets/Inter-SemiBold.ttf")),
      readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf")),
    ]);
    const res = new ImageResponse(
      React.createElement(StoryCard, { input, result }),
      {
        width: 1080,
        height: 1920,
        fonts: [
          { name: "Inter", data: inter, weight: 600, style: "normal" },
          { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
        ],
      },
    );
    return new Uint8Array(await res.arrayBuffer());
  }

  it("produces a non-empty PNG for a normal decision", async () => {
    const png = await rasterize("Should I quit my stable job to go all-in?", sampleResult);
    expect(png.byteLength).toBeGreaterThan(1000);
  }, 30000);

  it("rasterizes a long, quote-heavy input without a Satori layout error", async () => {
    const long =
      "Should I \"quit\" my very stable, well-paid job of eight years to go all-in on a risky side project that might not pay the bills for a long, uncertain while?";
    const png = await rasterize(long, sampleResult);
    expect(png.byteLength).toBeGreaterThan(1000);
  }, 30000);
});
