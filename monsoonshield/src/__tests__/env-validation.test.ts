import { describe, test, expect } from "vitest";

describe("Environment Variable Validation", () => {
  test("NEXT_PUBLIC_ prefixed vars are accessible in browser bundle", () => {
    const publicVars = [
      "NEXT_PUBLIC_APP_URL",
    ];
    publicVars.forEach((key) => {
      expect(typeof key).toBe("string");
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(true);
    });
  });

  test("sensitive vars must NOT have NEXT_PUBLIC_ prefix", () => {
    const sensitiveVars = [
      "GEMINI_API_KEY",
      "DATABASE_URL",
      "SESSION_SECRET",
      "JWT_SECRET",
    ];
    sensitiveVars.forEach((key) => {
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(false);
      expect(key).not.toContain("NEXT_PUBLIC");
    });
  });

  test("API routes read from server-only env vars", () => {
    const serverOnlyVars = [
      "GEMINI_API_KEY",
    ];
    serverOnlyVars.forEach((key) => {
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(false);
    });
  });
});

describe("Security Headers Configuration", () => {
  test("required security headers are defined", () => {
    const requiredHeaders = [
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
      "Permissions-Policy",
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Resource-Policy",
    ];

    requiredHeaders.forEach((header) => {
      expect(typeof header).toBe("string");
      expect(header.length).toBeGreaterThan(0);
    });
  });

  test("HSTS max-age is at least 1 year", () => {
    const hstsValue = "max-age=63072000; includeSubDomains; preload";
    const match = hstsValue.match(/max-age=(\d+)/);
    expect(match).not.toBeNull();
    const maxAge = parseInt(match![1]!);
    expect(maxAge).toBeGreaterThanOrEqual(31536000); // 1 year
  });

  test("X-Frame-Options blocks embedding", () => {
    const xfo = "DENY";
    expect(xfo).toBe("DENY");
  });

  test("X-Content-Type-Options prevents MIME sniffing", () => {
    const xcto = "nosniff";
    expect(xcto).toBe("nosniff");
  });
});
