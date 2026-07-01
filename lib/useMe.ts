"use client";

import { useEffect, useState } from "react";

export type Me = {
  configured: boolean;
  authenticated: boolean;
  email: string | null;
  plan: "free" | "pro" | "creator" | null;
};

export function isSubscriberPlan(plan: Me["plan"]): boolean {
  return plan === "pro" || plan === "creator";
}

// Fetches the current viewer's auth + plan once on mount. Returns `undefined`
// while loading so callers can avoid flashing plan-dependent UI (e.g. upsells).
export function useMe(): Me | undefined {
  const [me, setMe] = useState<Me | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: Me) => {
        if (active) setMe(d);
      })
      .catch(() => {
        if (active) setMe({ configured: false, authenticated: false, email: null, plan: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return me;
}
