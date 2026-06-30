import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const haveEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

export const isRateLimitConfigured = haveEnv;

// 5 requests per 1 minute per identifier (per-IP burst guard — ABUSE-01).
export const ratelimit = haveEnv
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "whatif:simulate",
      analytics: false,
    })
  : null;
