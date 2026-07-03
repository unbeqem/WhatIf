import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const FOLLOWUP_AGE_DAYS = 30;
const BATCH_LIMIT = 100;

export type FollowUpSummary = {
  skipped: boolean;
  reason?: string;
  candidates?: number;
  sent?: number;
  failed?: number;
};

function followUpEmail(input: string): { subject: string; html: string } {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://what-if.tech";
  const decision = input.length > 140 ? `${input.slice(0, 140)}…` : input;
  return {
    subject: "A month ago you asked the oracle something — what happened?",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1523">
        <p>A month ago you simulated a decision on WhatIf:</p>
        <blockquote style="border-left:3px solid #a855f7;margin:16px 0;padding:8px 16px;color:#5b5670;font-style:italic">
          &ldquo;${escapeHtml(decision)}&rdquo;
        </blockquote>
        <p>Did you make the call? How did it actually play out? We'd genuinely like to know —
        it makes the oracle sharper for the next person.</p>
        <p style="margin:24px 0">
          <a href="${baseUrl}/history" style="background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block">
            Tell us what happened →
          </a>
        </p>
        <p style="color:#8a8598;font-size:13px">Or run a new simulation whenever the next fork shows up.</p>
      </div>`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sweep aged simulations and send one "what happened?" follow-up per user.
 * Safe no-op when Supabase isn't configured or the follow-up columns don't
 * exist yet. Marks every processed row as sent so it isn't reconsidered.
 */
export async function runFollowUps(): Promise<FollowUpSummary> {
  if (!supabaseAdmin) return { skipped: true, reason: "no_supabase" };

  const cutoff = new Date(Date.now() - FOLLOWUP_AGE_DAYS * 86_400_000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("simulations")
    .select("id, user_id, input, created_at")
    .is("follow_up_sent_at", null)
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    // Most likely the migration (0005) hasn't been applied yet — degrade safely.
    console.error("[followup] query error", error.message);
    return { skipped: true, reason: "query_error" };
  }

  const rows = data ?? [];
  const emailedUsers = new Set<string>();
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const nowIso = new Date().toISOString();

    // One follow-up per user per sweep; still mark the row so it's not reprocessed.
    if (!emailedUsers.has(row.user_id)) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      const to = userRes?.user?.email;
      if (to) {
        const { subject, html } = followUpEmail(row.input);
        const result = await sendEmail({ to, subject, html });
        if (result.sent) sent += 1;
        else if (!result.skipped) failed += 1;
        emailedUsers.add(row.user_id);
      }
    }

    await supabaseAdmin
      .from("simulations")
      .update({ follow_up_sent_at: nowIso })
      .eq("id", row.id);
  }

  return { skipped: false, candidates: rows.length, sent, failed };
}
