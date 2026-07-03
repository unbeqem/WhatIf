export type Scenario = {
  title: string;
  tag: "Best Case" | "Likely" | "Worst Case" | string;
  probability: number;
  short_term: string;
  long_term: string;
  key_risk: string;
};

export type LockedInsight = {
  headline: string;
  detail: string;
};

export type SimulationResult = {
  scenarios: Scenario[];
  most_likely: string;
  recommendation: string;
  reasoning: string;
  locked_insight?: LockedInsight;
  demo?: boolean;
};
