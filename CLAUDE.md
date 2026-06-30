# CLAUDE.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

**WhatIf** — AI decision-simulation SaaS.

A user types a real decision they're carrying ("should I quit my job", "should I move countries") and the model projects three realistic futures with probabilities and a sober recommendation. TikTok-native: shareable result, soft paywall, short funnel.

**Core Value:** A user must be able to type a decision, get a sober three-future simulation in seconds, hit a soft paywall, and pay — without friction.

**Current milestone:** `v1-production-launch` (4 phases — see `.planning/ROADMAP.md`)

Full context: `.planning/PROJECT.md`
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** Tailwind v4 (CSS-first theme in `app/globals.css`), motion/react for animation, lucide-react for icons
- **AI:** OpenAI `gpt-4o-mini` via the official `openai` SDK
- **Payments:** Stripe Checkout + webhook (sub model)
- **Auth + DB:** Supabase (planned for Phase 1 — EU region, email/password)
- **Hosting:** Vercel (planned for Phase 4)
- **Demo mode:** Both `/api/simulate` and `/api/stripe` ship canned fallbacks when env keys are missing — intentional, keeps local dev and marketing recordings working.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Path alias:** `@/*` → project root (configured in `tsconfig.json`).
- **Server components by default;** mark interactive components with `"use client"` at the top.
- **API routes** live under `app/api/*/route.ts`. Use `NextRequest` / `NextResponse`, validate input shape, return JSON.
- **Tailwind v4 tokens** are declared in `@theme` inside `app/globals.css`. Colors used as `bg-violet`, `text-cyan-glow`, `border-border-hi`, etc. — don't add new tokens without a reason.
- **Copy** in user-facing UI is English. Founder-facing answers can be German.
- **No comments unless the WHY is non-obvious.** Identifiers carry intent; don't narrate what the code does.
- **No new files when an existing one fits.** Default to editing.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Three-page MVP today:

- `app/page.tsx` — Landing (Hero → Problem → How → Demo → Pricing → Final CTA)
- `app/decision/page.tsx` — Input form (`components/SimulateForm.tsx`)
- `app/result/page.tsx` — Result view (`components/ResultView.tsx`, reads from `sessionStorage`)

Two API routes:

- `app/api/simulate/route.ts` — POST { input } → `simulateDecision()` in `lib/openai.ts`
- `app/api/stripe/route.ts` — POST { plan } → `createCheckoutSession()` in `lib/stripe.ts`

Shared lib:

- `lib/prompts.ts` — system prompt + decision prompt (JSON-output contract)
- `lib/types.ts` — `Scenario`, `SimulationResult`
- `lib/openai.ts` — OpenAI client + demo fallback
- `lib/stripe.ts` — Stripe client + plan config + demo fallback

State handoff `/decision` → `/result` goes through `sessionStorage["whatif:last"]`. Intentional — the result fades on tab close, which drives the "save your history" Pro upgrade.

Phases 1-2 will add Supabase (`users`, `subscriptions` tables) and a third API route (`app/api/stripe/webhook/route.ts`). The `simulateDecision` flow gets plan-aware gating in Phase 2.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project-local skills yet. Add skills under `.claude/skills/<name>/SKILL.md` if patterns emerge that need a dedicated workflow.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

This project is managed via GSD (Get Shit Done). Planning artifacts live in `.planning/`:

- `PROJECT.md` — vision, constraints, decisions
- `REQUIREMENTS.md` — 29 v1 requirements with REQ-IDs
- `ROADMAP.md` — 4 phases with goal-backward success criteria
- `STATE.md` — current position, next action

**Before using Edit, Write, or other file-changing tools, start work through a GSD command** so planning artifacts and execution context stay in sync.

Entry points:

- `/gsd-progress` — situational check, advance the workflow
- `/gsd-plan-phase <n>` — decompose a phase into executable plans (next up: `/gsd-plan-phase 1`)
- `/gsd-execute-phase <n>` — execute all plans for a phase
- `/gsd-quick` — small ad-hoc fixes outside a phase
- `/gsd-debug` — systematic debugging
- `/gsd-manager` — interactive multi-phase command center

**Phase order is locked by the founder** (see PROJECT.md → Key Decisions). Do not re-sequence without an explicit conversation.

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
