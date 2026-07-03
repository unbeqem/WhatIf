// Interprets a Supabase AuthError into a stable, client-facing error code + a
// specific human message. Keeps the "real reason" (esp. weak password) instead
// of collapsing everything into a generic 500.

export type AuthErrorCode =
  | "weak_password"
  | "email_not_confirmed"
  | "email_exists"
  | "invalid_credentials"
  | "rate_limited"
  | "unknown";

export type InterpretedAuthError = {
  code: AuthErrorCode;
  status: number;
  message?: string;
};

// Shape we read off supabase-js AuthError / AuthWeakPasswordError without
// importing the class (avoids a hard type dependency at call sites).
type SupabaseAuthErrorLike = {
  code?: string;
  status?: number;
  message?: string;
  reasons?: string[];
};

const FULL_POLICY =
  "at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol";

const REASON_TEXT: Record<string, string> = {
  length: "at least 8 characters",
  characters: "an uppercase letter, a lowercase letter, a number, and a symbol",
  pwned: "a password that hasn't appeared in a known data breach",
};

function joinReadable(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function weakPasswordMessage(reasons?: string[]): string {
  const mapped = (reasons ?? [])
    .map((r) => REASON_TEXT[r])
    .filter((v): v is string => Boolean(v));
  if (mapped.length === 0) return `Password must have ${FULL_POLICY}.`;
  return `Password must have ${joinReadable(mapped)}.`;
}

export function interpretAuthError(error: unknown): InterpretedAuthError {
  const e = (error ?? {}) as SupabaseAuthErrorLike;
  const code = e.code;
  const status = e.status;

  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return { code: "rate_limited", status: 429 };
  }

  if (code === "weak_password" || status === 422) {
    return {
      code: "weak_password",
      status: 400,
      message: weakPasswordMessage(e.reasons),
    };
  }

  if (code === "email_not_confirmed") {
    return { code: "email_not_confirmed", status: 403 };
  }

  if (code === "user_already_exists" || code === "email_exists") {
    return { code: "email_exists", status: 409 };
  }

  if (code === "invalid_credentials" || status === 400 || status === 401) {
    return { code: "invalid_credentials", status: 401 };
  }

  return { code: "unknown", status: 500 };
}
