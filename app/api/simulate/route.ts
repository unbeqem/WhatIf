import { NextRequest, NextResponse } from "next/server";
import { simulateDecision } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (typeof input !== "string" || input.trim().length < 8) {
      return NextResponse.json(
        { error: "Tell me a little more — at least a sentence." },
        { status: 400 },
      );
    }

    if (input.length > 1500) {
      return NextResponse.json(
        { error: "Decision is too long. Keep it under 1500 characters." },
        { status: 400 },
      );
    }

    const result = await simulateDecision(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[simulate] error", err);
    return NextResponse.json(
      { error: "The oracle is silent. Try again in a moment." },
      { status: 500 },
    );
  }
}
