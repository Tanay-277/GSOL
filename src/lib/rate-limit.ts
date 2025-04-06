/**
 * Rate limiting utility for API routes
 * Prevents abuse and ensures fair usage of resources
 */

export interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

export interface RateLimit {
  check: (limit: number, token: string) => Promise<void>;
}

// In-memory store for rate limiting
// For production, consider using Redis or another distributed cache
const rateLimitStore: Record<string, number[]> = {};

export function rateLimit(options: RateLimitOptions): RateLimit {
  const { interval, uniqueTokenPerInterval } = options;

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      rateLimitStore[key] = rateLimitStore[key].filter((timestamp) => now - timestamp < interval);

      if (rateLimitStore[key].length === 0) {
        delete rateLimitStore[key];
      }
    });
  }, interval);

  return {
    check: (limit: number, token: string) => {
      const now = Date.now();
      const key = `${token}`;

      // Initialize token store if it doesn't exist
      if (!rateLimitStore[key]) {
        rateLimitStore[key] = [];
      }

      // Filter out timestamps outside the current interval window
      rateLimitStore[key] = rateLimitStore[key].filter((timestamp) => now - timestamp < interval);

      // Check if limit is exceeded
      if (rateLimitStore[key].length >= limit) {
        return Promise.reject(new Error("Rate limit exceeded"));
      }

      // Add current timestamp to the store
      rateLimitStore[key].push(now);

      // Make sure we're not exceeding unique tokens per interval
      const tokenCount = Object.keys(rateLimitStore).length;
      if (tokenCount > uniqueTokenPerInterval) {
        // If too many unique tokens, remove the oldest ones
        const oldestTokens = Object.entries(rateLimitStore)
          .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
          .slice(0, tokenCount - uniqueTokenPerInterval)
          .map(([token]) => token);

        oldestTokens.forEach((token) => {
          delete rateLimitStore[token];
        });
      }

      return Promise.resolve();
    },
  };
}
