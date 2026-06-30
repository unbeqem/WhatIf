import "server-only";
import { ratelimit, isRateLimitConfigured } from "@/lib/upstash";

export type BurstResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export async function checkBurst(ipHash: string): Promise<BurstResult> {
  if (!isRateLimitConfigured || !ratelimit) {
    return { allowed: true }; // demo mode -- no limiter configured
  }

  const { success, reset } = await ratelimit.limit(ipHash);
  if (success) return { allowed: true };

  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { allowed: false, retryAfterSec };
}
