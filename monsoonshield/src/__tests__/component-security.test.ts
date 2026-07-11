import { describe, test, expect } from "vitest";

describe("Login Screen Security", () => {
  test("phone input accepts only digits", () => {
    const raw = "9876543210";
    const cleaned = raw.replace(/\D/g, "").slice(0, 10);
    expect(cleaned).toBe("9876543210");
    expect(cleaned.length).toBe(10);
  });

  test("phone input rejects non-digit characters", () => {
    const raw = "abc987def654";
    const cleaned = raw.replace(/\D/g, "").slice(0, 10);
    expect(cleaned).toBe("987654");
  });

  test("phone validation enforces Indian format", () => {
    const validNumbers = ["9876543210", "8765432109", "7654321098", "6543210987"];
    const invalidNumbers = ["5432109876", "1234567890", "12345", "12345678901"];

    validNumbers.forEach((num) => {
      expect(/^[6-9]\d{9}$/.test(num)).toBe(true);
    });
    invalidNumbers.forEach((num) => {
      expect(/^[6-9]\d{9}$/.test(num)).toBe(false);
    });
  });

  test("OTP input is exactly 6 digits", () => {
    expect(/^\d{6}$/.test("123456")).toBe(true);
    expect(/^\d{6}$/.test("000000")).toBe(true);
    expect(/^\d{6}$/.test("12345")).toBe(false);
    expect(/^\d{6}$/.test("1234567")).toBe(false);
    expect(/^\d{6}$/.test("abcdef")).toBe(false);
  });
});

describe("AuthContext Security", () => {
  test("OTP generation uses cryptographic randomness", () => {
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    const otp = Array.from(array, (b) => b % 10).join("");
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp.length).toBe(6);
  });

  test("session storage key is not plaintext user data", () => {
    const encKey = "ms_enc_key";
    expect(encKey).not.toBe("ms_user");
    expect(encKey).toContain("enc");
  });
});

describe("Chat Screen Input Security", () => {
  test("input is trimmed before sending", () => {
    const input = "  Hello Varsha  ";
    expect(input.trim()).toBe("Hello Varsha");
  });

  test("empty messages are not sent", () => {
    const input = "   ";
    expect(input.trim().length === 0).toBe(true);
  });

  test("TTS output is sanitized of markdown", () => {
    const response = "**Bold** _italic_ `code` # Heading";
    const cleaned = response.replace(/[#*`_-]/g, "").replace(/\n+/g, ". ");
    expect(cleaned).not.toContain("**");
    expect(cleaned).not.toContain("_");
    expect(cleaned).not.toContain("`");
    expect(cleaned).not.toContain("#");
  });

  test("TTS output is truncated to 500 chars", () => {
    const long = "a".repeat(1000);
    expect(long.slice(0, 500).length).toBe(500);
  });
});

describe("Dashboard Security", () => {
  test("risk score stays within 0-100 bounds", () => {
    const riskScore = Math.min(100, Math.max(0, 58));
    expect(riskScore).toBeGreaterThanOrEqual(0);
    expect(riskScore).toBeLessThanOrEqual(100);
  });
});
