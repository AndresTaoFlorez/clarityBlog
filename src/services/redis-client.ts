// backend/src/services/redis-client.ts
import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Note: Upstash uses REST API, no persistent connection events
console.log("✅ Upstash Redis client initialized");

// Token blacklist utilities
export class TokenBlacklist {
  /**
   * Add token to blacklist (only for recent logouts)
   * @param token - JWT token to blacklist
   * @param expiresInSeconds - Time until token naturally expires
   */
  static async add(token: string, expiresInSeconds: number): Promise<void> {
    try {
      const key = `blacklist:${token}`;
      await redis.setex(key, expiresInSeconds, "1");
    } catch (error) {
      console.error("Error adding token to blacklist:", error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   * @param token - JWT token to check
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      // On error, allow request to proceed (fail open)
      return false;
    }
  }

  /**
   * Remove token from blacklist (mainly for testing)
   * @param token - JWT token to remove
   */
  static async remove(token: string): Promise<void> {
    try {
      const key = `blacklist:${token}`;
      await redis.del(key);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get count of blacklisted tokens (for monitoring)
   */
  static async count(): Promise<number> {
    try {
      const keys = await redis.keys("blacklist:*");
      return keys.length;
    } catch (error) {
      return 0;
    }
  }
}
