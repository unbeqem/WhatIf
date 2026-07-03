import { describe, it, expect } from "vitest";
import { interpretAuthError, weakPasswordMessage } from "./error-map";

describe("weakPasswordMessage", () => {
  it("falls back to the full policy when no reasons given", () => {
    expect(weakPasswordMessage()).toContain("at least 8 characters");
    expect(weakPasswordMessage([])).toContain("uppercase letter");
  });

  it("maps a single reason", () => {
    expect(weakPasswordMessage(["length"])).toBe("Password must have at least 8 characters.");
  });

  it("joins two reasons with 'and'", () => {
    const msg = weakPasswordMessage(["length", "characters"]);
    expect(msg).toBe(
      "Password must have at least 8 characters and an uppercase letter, a lowercase letter, a number, and a symbol.",
    );
  });

  it("ignores unknown reason codes", () => {
    expect(weakPasswordMessage(["length", "bogus"])).toBe(
      "Password must have at least 8 characters.",
    );
  });
});

describe("interpretAuthError", () => {
  it("detects weak_password by code and includes a specific message", () => {
    const r = interpretAuthError({ code: "weak_password", status: 422, reasons: ["characters"] });
    expect(r.code).toBe("weak_password");
    expect(r.status).toBe(400);
    expect(r.message).toContain("uppercase letter");
  });

  it("detects weak_password by status 422 even without a code", () => {
    expect(interpretAuthError({ status: 422 }).code).toBe("weak_password");
  });

  it("maps email_not_confirmed to 403", () => {
    expect(interpretAuthError({ code: "email_not_confirmed", status: 400 })).toEqual({
      code: "email_not_confirmed",
      status: 403,
    });
  });

  it("maps user_already_exists and email_exists to email_exists 409", () => {
    expect(interpretAuthError({ code: "user_already_exists" }).code).toBe("email_exists");
    expect(interpretAuthError({ code: "email_exists" }).status).toBe(409);
  });

  it("normalizes bad credentials (400/401) to invalid_credentials 401", () => {
    expect(interpretAuthError({ code: "invalid_credentials", status: 400 })).toEqual({
      code: "invalid_credentials",
      status: 401,
    });
    expect(interpretAuthError({ status: 401 }).code).toBe("invalid_credentials");
  });

  it("maps 429 and rate-limit codes to rate_limited", () => {
    expect(interpretAuthError({ status: 429 }).code).toBe("rate_limited");
    expect(interpretAuthError({ code: "over_email_send_rate_limit" }).code).toBe("rate_limited");
  });

  it("rate limit (429) takes precedence even if a code is present", () => {
    expect(interpretAuthError({ status: 429, code: "weak_password" }).code).toBe("rate_limited");
  });

  it("falls back to unknown/500 for unrecognized errors", () => {
    expect(interpretAuthError({ message: "boom" })).toEqual({ code: "unknown", status: 500 });
    expect(interpretAuthError(null).code).toBe("unknown");
  });
});
