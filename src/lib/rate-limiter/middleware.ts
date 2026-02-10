import { NextRequest, NextResponse } from "next/server";
import type { RateLimitResult } from "./index";

/**
 * Get client identifier from request
 * Extracts IP address or falls back to user agent
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (handles proxies and load balancers)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare
  
  const ip = 
    cfConnectingIp || 
    realIp || 
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
    "unknown";
  
  return ip;
}

/**
 * Create rate limit error response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: retryAfter,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.reset).toISOString(),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

/**
 * Apply rate limit headers to successful response
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(result.reset).toISOString());
  return response;
}
