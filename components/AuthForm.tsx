"use client";

import { useState, FormEvent } from "react";

export type AuthMode = "signup" | "login" | "reset-request" | "reset";

type Props = {
  mode: AuthMode;
  endpoint: string;
  submitLabel: string;
  onSuccess: (body: any) => void;
};

const ERROR_COPY: Record<string, string> = {
  invalid_credentials: "Wrong email or password.",
  weak_password: "That password is too weak.",
  email_not_confirmed: "Confirm your email first — check your inbox for the link.",
  email_exists: "That email already has an account. Try logging in instead.",
  auth_unavailable: "Auth is in demo mode. Configure Supabase in .env.local to enable accounts.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  server_error: "Something went wrong. Try again in a moment.",
};

export default function AuthForm({ mode, endpoint, submitLabel, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<"email" | "password" | null>(null);

  const needsEmail = mode !== "reset";
  const needsPassword = mode !== "reset-request";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldError(null);
    setPending(true);

    const body: Record<string, string> = {};
    if (needsEmail) body.email = email.trim();
    if (needsPassword) body.password = password;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onSuccess(data);
        return;
      }

      if (data.error === "invalid_input" && (data.field === "email" || data.field === "password")) {
        setFieldError(data.field);
        setGeneralError(
          data.field === "email"
            ? "Enter a valid email address."
            : "Password must be at least 8 characters.",
        );
      } else {
        if (data.error === "weak_password") setFieldError("password");
        else if (data.error === "email_exists") setFieldError("email");
        // Prefer the server's specific reason (e.g. the exact weak-password rule).
        setGeneralError(data.message ?? ERROR_COPY[data.error] ?? "Something went wrong.");
      }
    } catch {
      setGeneralError("Connection failed. Check your network.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {needsEmail && (
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-mute">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-xl border bg-surface/40 px-4 py-3 text-fg outline-none transition-colors focus:border-violet-glow/60 ${
              fieldError === "email" ? "border-magenta/60" : "border-border"
            }`}
          />
        </div>
      )}
      {needsPassword && (
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-mute">
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-xl border bg-surface/40 px-4 py-3 text-fg outline-none transition-colors focus:border-violet-glow/60 ${
              fieldError === "password" ? "border-magenta/60" : "border-border"
            }`}
          />
        </div>
      )}

      {generalError && (
        <div className="rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {generalError}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-magenta px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(168,85,247,0.7)] transition-all hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
