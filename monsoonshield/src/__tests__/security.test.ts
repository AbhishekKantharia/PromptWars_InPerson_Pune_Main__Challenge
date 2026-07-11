import { describe, test, expect } from "vitest";
import {
  sanitizeInput,
  sanitizeForDisplay,
  stripHtml,
  validatePhoneNumber,
  validateOTP,
  validateEmail,
  checkRateLimit,
  detectSQLInjection,
  detectXSS,
  validateUserInput,
  validateLength,
  truncateToLength,
  encryptData,
  decryptData,
  generateCSRFToken,
  validateCSRFToken,
} from "../lib/security";

describe("Security Module — Input Sanitization", () => {
  test("sanitizeInput escapes HTML special characters", () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain("<script>");
    expect(sanitizeInput('<script>alert("xss")</script>')).toContain("&lt;script&gt;");
    expect(sanitizeInput('O\'Brien & "friends"')).not.toContain('"');
    expect(sanitizeInput("a`b")).not.toContain("`");
  });

  test("sanitizeForDisplay converts newlines to br tags", () => {
    const result = sanitizeForDisplay("line1\nline2");
    expect(result).toContain("<br>");
    expect(result).toContain("line1");
    expect(result).toContain("line2");
  });

  test("stripHtml removes all HTML tags and entities", () => {
    expect(stripHtml('<p class="test">Hello</p>')).toBe("Hello");
    expect(stripHtml("Hello &amp; World")).toBe("Hello  World");
    expect(stripHtml("<br/><img src=x onerror=alert(1)>")).toBe("");
  });
});

describe("Security Module — Input Validation", () => {
  test("validatePhoneNumber accepts valid Indian numbers", () => {
    expect(validatePhoneNumber("9876543210")).toBe(true);
    expect(validatePhoneNumber("8765432109")).toBe(true);
    expect(validatePhoneNumber("7654321098")).toBe(true);
    expect(validatePhoneNumber("6543210987")).toBe(true);
  });

  test("validatePhoneNumber rejects invalid numbers", () => {
    expect(validatePhoneNumber("5432109876")).toBe(false);
    expect(validatePhoneNumber("1234567890")).toBe(false);
    expect(validatePhoneNumber("987654321")).toBe(false);
    expect(validatePhoneNumber("98765432101")).toBe(false);
    expect(validatePhoneNumber("abcdefghij")).toBe(false);
  });

  test("validateOTP accepts exactly 6 digits", () => {
    expect(validateOTP("123456")).toBe(true);
    expect(validateOTP("000000")).toBe(true);
    expect(validateOTP("12345")).toBe(false);
    expect(validateOTP("1234567")).toBe(false);
    expect(validateOTP("abcdef")).toBe(false);
  });

  test("validateEmail accepts valid formats", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co")).toBe(true);
  });

  test("validateEmail rejects invalid formats", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Security Module — Rate Limiting", () => {
  test("checkRateLimit allows requests within limit", () => {
    const key = `test_${Date.now()}`;
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
  });

  test("checkRateLimit blocks requests exceeding limit", () => {
    const key = `test_block_${Date.now()}`;
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);
    expect(checkRateLimit(key, 2, 60000)).toBe(false);
  });
});

describe("Security Module — Attack Detection", () => {
  test("detectSQLInjection identifies SQL patterns", () => {
    expect(detectSQLInjection("'; DROP TABLE users; --")).toBe(true);
    expect(detectSQLInjection("1' OR '1'='1")).toBe(true);
    expect(detectSQLInjection("SELECT * FROM users")).toBe(true);
    expect(detectSQLInjection("UNION SELECT password FROM admins")).toBe(true);
  });

  test("detectSQLInjection allows safe input", () => {
    expect(detectSQLInjection("Hello world")).toBe(false);
    expect(detectSQLInjection("What is flood safety?")).toBe(false);
    expect(detectSQLInjection("9876543210")).toBe(false);
  });

  test("detectXSS identifies XSS patterns", () => {
    expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
    expect(detectXSS('javascript:alert(1)')).toBe(true);
    expect(detectXSS('onclick="alert(1)"')).toBe(true);
    expect(detectXSS('<iframe src="evil.com">')).toBe(true);
    expect(detectXSS('<object data="evil.swf">')).toBe(true);
    expect(detectXSS('<embed src="evil.swf">')).toBe(true);
  });

  test("detectXSS allows safe input", () => {
    expect(detectXSS("Hello world")).toBe(false);
    expect(detectXSS("price: $5 < $10")).toBe(false);
    expect(detectXSS("user@example.com")).toBe(false);
  });
});

describe("Security Module — Combined Validation", () => {
  test("validateUserInput passes safe input", () => {
    const result = validateUserInput("Hello, this is safe text");
    expect(result.safe).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("validateUserInput rejects empty input", () => {
    const result = validateUserInput("");
    expect(result.safe).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("validateUserInput rejects overly long input", () => {
    const result = validateUserInput("a".repeat(6000), 5000);
    expect(result.safe).toBe(false);
  });

  test("validateUserInput detects SQL injection", () => {
    const result = validateUserInput("'; DROP TABLE users; --");
    expect(result.safe).toBe(false);
  });

  test("validateUserInput detects XSS", () => {
    const result = validateUserInput('<script>alert("xss")</script>');
    expect(result.safe).toBe(false);
  });

  test("validateUserInput respects maxLength parameter", () => {
    expect(validateLength("hello", 10, 1)).toBe(true);
    expect(validateLength("hello world!", 10, 1)).toBe(false);
    expect(validateLength("", 10, 1)).toBe(false);
  });

  test("truncateToLength truncates correctly", () => {
    expect(truncateToLength("hello", 10)).toBe("hello");
    expect(truncateToLength("hello world", 5)).toBe("hello");
    expect(truncateToLength("", 5)).toBe("");
  });
});

describe("Security Module — Encryption", () => {
  test("encryptData and decryptData round-trip correctly", async () => {
    const plaintext = "Sensitive user data: 9876543210";
    const encrypted = await encryptData(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test("encryption produces different ciphertext for same plaintext (random IV)", async () => {
    const plaintext = "same data";
    const enc1 = await encryptData(plaintext);
    const enc2 = await encryptData(plaintext);
    // Different IVs mean different ciphertexts
    expect(enc1).not.toBe(enc2);
    // But both decrypt to same plaintext
    expect(await decryptData(enc1)).toBe(plaintext);
    expect(await decryptData(enc2)).toBe(plaintext);
  });

  test("decryptData rejects tampered data", async () => {
    const encrypted = await encryptData("test data");
    const tampered = encrypted.slice(0, -4) + "XXXX";
    await expect(decryptData(tampered)).rejects.toThrow();
  });
});

describe("Security Module — CSRF Token", () => {
  test("generateCSRFToken returns consistent token within session", () => {
    const token1 = generateCSRFToken();
    const token2 = generateCSRFToken();
    expect(token1).toBe(token2);
    expect(token1.length).toBeGreaterThan(0);
  });

  test("validateCSRFToken accepts valid token", () => {
    const token = generateCSRFToken();
    expect(validateCSRFToken(token)).toBe(true);
  });

  test("validateCSRFToken rejects invalid token", () => {
    expect(validateCSRFToken("invalid-token-12345")).toBe(false);
  });
});
