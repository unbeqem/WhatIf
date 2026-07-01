import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
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
