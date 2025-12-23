// backend/src/services/redis-client.ts
import Redis from "ioredis";

// Initialize Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Handle Redis connection events
redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

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
      console.log(`🔒 Token blacklisted for ${expiresInSeconds}s`);
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
      console.error("Error checking blacklist:", error);
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
      console.error("Error removing token from blacklist:", error);
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
      console.error("Error counting blacklisted tokens:", error);
      return 0;
    }
  }
}
