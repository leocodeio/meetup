/**
 * In-memory rate limiter using sliding window algorithm
 * Industry standard implementation for API route protection
 */

interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 10
   */
  limit?: number;
  
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;
  
  /**
   * Key prefix for identifying rate limit buckets
   * @default "ratelimit"
   */
  prefix?: string;
}

interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean;
  
  /**
   * Maximum requests allowed
   */
  limit: number;
  
  /**
   * Remaining requests in current window
   */
  remaining: number;
  
  /**
   * Timestamp when the rate limit resets
   */
  reset: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RequestRecord> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly prefix: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions = {}) {
    this.limit = options.limit ?? 10;
    this.windowMs = options.windowMs ?? 60000; // 1 minute default
    this.prefix = options.prefix ?? "ratelimit";
    
    // Clean up expired entries every minute
    this.startCleanup();
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID, API key)
   * @returns Rate limit result
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    
    const record = this.store.get(key);
    
    // No record exists or window has expired
    if (!record || now >= record.resetTime) {
      const resetTime = now + this.windowMs;
      this.store.set(key, { count: 1, resetTime });
      
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetTime,
      };
    }
    
    // Within the time window
    if (record.count < this.limit) {
      record.count++;
      this.store.set(key, record);
      
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - record.count,
        reset: record.resetTime,
      };
    }
    
    // Rate limit exceeded
    return {
      success: false,
      limit: this.limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now >= record.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean up every minute
    
    // Don't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all rate limit records
   */
  reset(): void {
    this.store.clear();
  }
}

/**
 * Create a new rate limiter instance
 */
export function createRateLimiter(options?: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Default rate limiter for API routes
 * 10 requests per minute
 */
export const apiRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60000,
  prefix: "api",
});

/**
 * Stricter rate limiter for AI/expensive operations
 * 5 requests per minute
 */
export const aiRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60000,
  prefix: "ai",
});

/**
 * Rate limiter for mail operations
 * 10 emails per hour per user
 */
export const mailRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 3600000, // 1 hour
  prefix: "mail",
});

export type { RateLimiterOptions, RateLimitResult };
