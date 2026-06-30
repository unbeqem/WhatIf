// RFC-5322 lite: good-enough email shape check. Supabase does the real validation.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Credentials = { email: string; password: string };

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; field: "email" | "password" | "body" };

export function parseCredentials(raw: unknown): ValidationResult<Credentials> {
  if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
  const r = raw as Record<string, unknown>;
  if (typeof r.email !== "string" || !EMAIL_RE.test(r.email.trim())) {
    return { ok: false, field: "email" };
  }
  if (typeof r.password !== "string" || r.password.length < 8 || r.password.length > 200) {
    return { ok: false, field: "password" };
  }
  return { ok: true, value: { email: r.email.trim().toLowerCase(), password: r.password } };
}

export function parsePassword(raw: unknown): ValidationResult<{ password: string }> {
  if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
  const r = raw as Record<string, unknown>;
  if (typeof r.password !== "string" || r.password.length < 8 || r.password.length > 200) {
    return { ok: false, field: "password" };
  }
  return { ok: true, value: { password: r.password } };
}

export function parseEmail(raw: unknown): ValidationResult<{ email: string }> {
  if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
  const r = raw as Record<string, unknown>;
  if (typeof r.email !== "string" || !EMAIL_RE.test(r.email.trim())) {
    return { ok: false, field: "email" };
  }
  return { ok: true, value: { email: r.email.trim().toLowerCase() } };
}
