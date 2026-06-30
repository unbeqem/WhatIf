import "server-only";
import { createHmac, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "whatif_anon" as const;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

let warnedAboutSecret = false;
function getSecret(): string {
  const s = process.env.ANON_COOKIE_SECRET;
  if (s && s.length >= 16) return s;
  if (!warnedAboutSecret) {
    console.warn(
      "[anon] ANON_COOKIE_SECRET missing or too short — using dev fallback. " +
        "Set ANON_COOKIE_SECRET (>=32 hex chars) before production.",
    );
    warnedAboutSecret = true;
  }
  return "dev-only-do-not-use-in-prod-anon-secret-9c4b";
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function verify(signed: string, secret: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = sign(payload, secret);
  if (!constantTimeEqual(mac, expected)) return null;
  // Payload is the UUID itself; validate shape.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload)) {
    return null;
  }
  return payload;
}

function extractIp(req: NextRequest): string {
  // x-forwarded-for is "client, proxy1, proxy2..." -- take the first hop.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}

function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}

export type AnonIdentity = {
  anonId: string;
  ipHash: string;
  cookieToSet?: {
    name: typeof COOKIE_NAME;
    value: string;
    options: {
      httpOnly: true;
      secure: boolean;
      sameSite: "lax";
      path: "/";
      maxAge: number;
    };
  };
};

export function getAnonIdentity(req: NextRequest): AnonIdentity {
  const secret = getSecret();
  const ip = extractIp(req);
  const ipHash = hashIp(ip, secret);

  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const verified = existing ? verify(existing, secret) : null;

  if (verified) {
    return { anonId: verified, ipHash };
  }

  const fresh = randomUUID();
  const signed = `${fresh}.${sign(fresh, secret)}`;

  return {
    anonId: fresh,
    ipHash,
    cookieToSet: {
      name: COOKIE_NAME,
      value: signed,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
      },
    },
  };
}

// Exposed for unit tests.
export const __internal = { sign, verify, hashIp, extractIp, COOKIE_NAME };
