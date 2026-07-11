import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter for API routes (per-Vercel-invocation, resets on cold start)
const apiRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkApiRateLimit(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = apiRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    apiRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Patterns that indicate potential attacks
const ATTACK_PATTERNS = [
  /(\.\.\/){2,}/,
  /(<script[^>]*>)/i,
  /(javascript:)/i,
  /(data:text\/html)/i,
  /(vbscript:)/i,
  /(eval\()/i,
  /(union\s+select)/i,
  /(or\s+1\s*=\s*1)/i,
];

function detectAttack(path: string, body?: string): boolean {
  if (ATTACK_PATTERNS.some((p) => p.test(path))) return true;
  if (body && ATTACK_PATTERNS.some((p) => p.test(body))) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security: Add correlation ID for request tracing
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);

  // Detect path traversal / injection attacks
  if (detectAttack(pathname)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // API route rate limiting
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Different limits per endpoint type
    let maxRequests = 30;
    let windowMs = 60000;

    if (pathname.startsWith("/api/chat")) {
      maxRequests = 20;
      windowMs = 60000;
    } else if (pathname.startsWith("/api/briefing")) {
      maxRequests = 5;
      windowMs = 300000;
    } else if (pathname.startsWith("/api/plan")) {
      maxRequests = 3;
      windowMs = 600000;
    }

    if (!checkApiRateLimit(ip, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Block non-POST requests to API routes
    if (request.method !== "POST" && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Validate Content-Type for API POST requests
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 415 }
        );
      }

      // Limit body size (100KB)
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 102400) {
        return NextResponse.json({ error: "Request too large" }, { status: 413 });
      }
    }
  }

  // Block common bot/scanner paths
  const blockedPaths = [
    "/wp-admin",
    "/wp-login",
    "/.env",
    "/.git",
    "/phpmyadmin",
    "/xmlrpc.php",
    "/config",
    "/backup",
    "/admin/config",
    "/.well-known/security.txt",
  ];

  if (blockedPaths.some((p) => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  // CORS headers for API routes only
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg|manifest.json|apple-touch-icon.png|og-image.png).*)",
  ],
};
