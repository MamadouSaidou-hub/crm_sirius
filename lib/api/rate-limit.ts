/**
 * Rate limiting utility for API routes.
 *
 * Current status: Not yet implemented.
 *
 * Recommended implementations (in order of preference):
 * 1. **Vercel Edge Rate Limiting** (free tier available)
 *    - Built into Vercel platform, no external dependency
 *    - Use: https://vercel.com/docs/edge-network/headers
 *
 * 2. **Upstash Redis + @upstash/ratelimit**
 *    - Distributed rate limiting with Redis backend
 *    - npm install @upstash/ratelimit @upstash/redis
 *
 * 3. **Next.js middleware with in-memory cache** (development only)
 *    - Simple but not suitable for production with multiple instances
 *
 * Critical routes to protect:
 * - POST /api/insurers/askia/simulate (tarification queries)
 * - GET /api/insurers/askia/referentiel (catalog queries)
 * - POST /api/users (user creation)
 *
 * Recommended limits:
 * - Tarification: 10 req/minute per user
 * - Referential: 30 req/minute per user
 * - User creation: 2 req/minute per admin
 *
 * TODO: Implement before production deployment
 */

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit(
  _key: string,
  _limit: number,
  _window: number,
): Promise<RateLimitResult> {
  // Placeholder for rate limiting implementation
  // Return success for now; implement before production
  return {
    success: true,
    remaining: _limit,
    resetAt: Date.now() + _window,
  };
}
