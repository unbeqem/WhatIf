import "server-only";

// Transactional email sender, deliberately independent of Supabase Auth SMTP
// (which has been fragile in this project — see prod notes). Uses the Resend
// HTTP API when RESEND_API_KEY is set; otherwise it is a safe no-op that logs,
// so nothing breaks in local/demo or before the provider is configured.

export type SendEmailResult =
  | { sent: true }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; skipped: false; error: string };

const FROM = process.env.EMAIL_FROM ?? "WhatIf <hello@what-if.tech>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email] skipped (no RESEND_API_KEY) → would send "${args.subject}" to ${args.to}`);
    return { sent: false, skipped: true, reason: "no_provider" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: args.to, subject: args.subject, html: args.html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] provider error ${res.status}: ${body}`);
      return { sent: false, skipped: false, error: `provider_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, skipped: false, error: "network" };
  }
}
