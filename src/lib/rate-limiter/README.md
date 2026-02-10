# Rate Limiter

A production-ready, in-memory rate limiter for Next.js API routes using the sliding window algorithm.

## Features

- **In-memory storage** - No external dependencies required
- **Sliding window algorithm** - Fair and accurate rate limiting
- **IP-based identification** - Automatic client identification with proxy support
- **Standard HTTP headers** - Follows industry best practices
- **TypeScript support** - Full type safety
- **Auto-cleanup** - Automatic memory management

## Usage

### Quick Start

Apply rate limiting to any API route:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { aiRateLimiter } from "@/lib/rate-limiter";
import { 
  getClientIdentifier, 
  createRateLimitResponse, 
  applyRateLimitHeaders 
} from "@/lib/rate-limiter/middleware";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const identifier = getClientIdentifier(req);
  const result = await aiRateLimiter.check(identifier);
  
  if (!result.success) {
    return createRateLimitResponse(result);
  }

  // Your API logic here
  const response = NextResponse.json({ success: true });
  
  // Add rate limit headers to response
  return applyRateLimitHeaders(response, result);
}
```

### Pre-configured Rate Limiters

Two rate limiters are available out of the box:

#### `apiRateLimiter`
- **Limit**: 10 requests per minute
- **Use case**: General API endpoints

#### `aiRateLimiter`
- **Limit**: 5 requests per minute
- **Use case**: AI/expensive operations (recommended for AI endpoints)

### Custom Rate Limiter

Create a custom rate limiter with your own limits:

```typescript
import { createRateLimiter } from "@/lib/rate-limiter";

const customRateLimiter = createRateLimiter({
  limit: 100,           // Max requests
  windowMs: 3600000,    // 1 hour in milliseconds
  prefix: "custom",     // Identifier prefix
});
```

## Configuration

### RateLimiterOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | `number` | `10` | Maximum requests allowed in the time window |
| `windowMs` | `number` | `60000` | Time window in milliseconds (default: 1 minute) |
| `prefix` | `string` | `"ratelimit"` | Key prefix for identifying rate limit buckets |

## Response Headers

When rate limited, the following standard headers are included:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until client can retry

## Client Identification

The `getClientIdentifier()` function extracts client IP from these headers (in order):

1. `cf-connecting-ip` (Cloudflare)
2. `x-real-ip`
3. `x-forwarded-for`
4. Falls back to `"unknown"`

## Error Response Format

429 Too Many Requests response:

```json
{
  "error": "Too many requests. Please try again later.",
  "limit": 5,
  "remaining": 0,
  "reset": 1706745600000,
  "retryAfter": 45
}
```

## Industry Standards Followed

- ✅ Uses sliding window algorithm (more accurate than fixed window)
- ✅ Returns 429 status code for rate limit exceeded
- ✅ Includes standard rate limit headers
- ✅ Provides retry-after guidance
- ✅ IP-based identification with proxy support
- ✅ Automatic memory cleanup to prevent leaks
- ✅ TypeScript for type safety

## Notes

- This is an **in-memory** implementation suitable for single-instance deployments
- For distributed/multi-instance deployments, consider using Redis-based solutions like `@upstash/ratelimit`
- Rate limit data is not persisted and will reset on server restart
- Cleanup runs every 60 seconds to remove expired entries
