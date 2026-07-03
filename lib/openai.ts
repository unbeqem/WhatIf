import OpenAI from "openai";
import { SYSTEM_PROMPT, decisionPrompt } from "./prompts";
import type { SimulationResult, DecisionContext } from "./types";

const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey ? new OpenAI({ apiKey }) : null;

export const isLive = Boolean(client);

export async function simulateDecision(
  input: string,
  ctx?: DecisionContext,
  refinement?: string,
): Promise<SimulationResult> {
  if (!client) {
    return demoSimulation(input);
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: decisionPrompt(input, ctx, refinement) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as SimulationResult;
  return parsed;
}

function demoSimulation(input: string): SimulationResult {
  const trimmed = input.trim().slice(0, 80) || "your decision";
  return {
    demo: true,
    scenarios: [
      {
        title: "The path you imagined",
        tag: "Best Case",
        probability: 25,
        short_term: `The first months feel exhilarating. Momentum carries you and "${trimmed}" looks like the obvious right call. Early signals are positive.`,
        long_term: "Years 2-5 reward the conviction. Identity, network, and finances compound in the direction you bet on. You forget you were ever uncertain.",
        key_risk: "Mistaking early luck for a durable trend and over-extending before you've stress-tested the assumptions.",
      },
      {
        title: "Slower, messier, mostly fine",
        tag: "Likely",
        probability: 55,
        short_term: "The honeymoon ends around month 3. You hit the boring middle: some wins, some doubts, no clear verdict. You consider walking back.",
        long_term: "By year 2 you've adapted and the original decision is now just background. The real outcomes came from the smaller choices you made afterward.",
        key_risk: "Drifting on autopilot — the decision becomes inertia and you stop actively re-evaluating it.",
      },
      {
        title: "The version you didn't want to see",
        tag: "Worst Case",
        probability: 20,
        short_term: "Within weeks the hidden costs surface — financial, relational, or self-image. You feel cornered and start rationalizing.",
        long_term: "If unaddressed, the cost compounds. Reversal is possible but expensive. You'd be unwinding both the decision and the identity you built around it.",
        key_risk: "Sunk-cost loyalty — staying because you've already paid, not because it still makes sense.",
      },
    ],
    most_likely: `The middle scenario is most probable for decisions framed like "${trimmed}". Big choices rarely deliver their promised drama — the outcome is usually shaped by what you do in the dull months after the leap, not the leap itself.`,
    recommendation: "Run the decision, but pre-commit to a 90-day review with one trusted person and a single quantitative trigger that would force you to reverse it. The decision matters less than the kill-switch.",
    reasoning: "Most people fail not because they chose wrong but because they refused to notice when reality diverged from the plan. A pre-committed checkpoint is cheap insurance against ego-driven persistence.",
    locked_insight: {
      headline: "68% chance the real regret is waiting, not choosing",
      detail:
        "For decisions like this, people rarely regret the action itself — they regret the months of limbo before it. The hidden cost isn't the wrong choice; it's how long you let the question run your life while you avoid deciding.",
    },
  };
}
