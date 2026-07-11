// Security utilities for MonsoonShield

// ============================================================
// INPUT SANITIZATION
// ============================================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

export function sanitizeInput(input: string): string {
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeForDisplay(input: string): string {
  return sanitizeInput(input).replace(/\n/g, "<br>");
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, "");
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// RATE LIMITING (client-side)
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function getRateLimitInfo(key: string): { remaining: number; resetAt: number } {
  const entry = rateLimitStore.get(key);
  if (!entry) return { remaining: 30, resetAt: Date.now() + 60000 };
  return { remaining: Math.max(0, 30 - entry.count), resetAt: entry.resetAt };
}

// ============================================================
// ENCRYPTION (AES-GCM via Web Crypto API)
// ============================================================

const ENCRYPTION_KEY_NAME = "ms_enc_key";

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = typeof window !== "undefined" ? sessionStorage.getItem(ENCRYPTION_KEY_NAME) : null;

  if (stored) {
    const rawKey = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);

  const exported = await crypto.subtle.exportKey("raw", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ENCRYPTION_KEY_NAME, b64);
  }

  return key;
}

export async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedB64: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

// ============================================================
// SECURE LOCAL STORAGE (encrypted)
// ============================================================

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const encrypted = await encryptData(value);
    localStorage.setItem(key, encrypted);
  } catch {
    console.error("Secure storage write failed");
  }
}

export async function secureGetItem(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return await decryptData(encrypted);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function secureRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// ============================================================
// CSRF TOKEN
// ============================================================

let csrfToken: string | null = null;

export function generateCSRFToken(): string {
  if (csrfToken) return csrfToken;
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  csrfToken = btoa(String.fromCharCode(...array));
  return csrfToken;
}

export function validateCSRFToken(token: string): boolean {
  return token === csrfToken;
}

// ============================================================
// CONTENT SECURITY POLICY HELPERS
// ============================================================

export function getCSPToken(): string {
  return generateCSRFToken();
}

// ============================================================
// INPUT LENGTH VALIDATION
// ============================================================

export function validateLength(input: string, max: number, min: number = 0): boolean {
  const len = input.trim().length;
  return len >= min && len <= max;
}

export function truncateToLength(input: string, max: number): string {
  return input.length > max ? input.slice(0, max) : input;
}

// ============================================================
// SQL INJECTION PREVENTION (pattern detection)
// ============================================================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FETCH|DECLARE|TRUNCATE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
  /(' OR '1'='1|' OR 1=1|' --|"; --)/i,
  /(\bOR\b\s+\b\d+\b\s*=\s*\b\d+\b)/i,
];

export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================================
// XSS PATTERNS
// ============================================================

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\(/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
];

export function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================================
// COMBINED SECURITY VALIDATION
// ============================================================

export interface ValidationResult {
  safe: boolean;
  errors: string[];
}

export function validateUserInput(
  input: string,
  maxLength: number = 5000,
  options?: { allowHtml?: boolean; checkSQL?: boolean; checkXSS?: boolean }
): ValidationResult {
  const errors: string[] = [];

  if (!validateLength(input, maxLength, 1)) {
    errors.push(`Input must be between 1 and ${maxLength} characters`);
  }

  if (options?.checkSQL !== false && detectSQLInjection(input)) {
    errors.push("Potentially unsafe input detected");
  }

  if (options?.checkXSS !== false && detectXSS(input)) {
    errors.push("Potentially unsafe content detected");
  }

  if (!options?.allowHtml && detectXSS(input)) {
    errors.push("HTML content is not allowed");
  }

  return { safe: errors.length === 0, errors };
}
