import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

function createRedisClient(lazy = true): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: lazy,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
  });
  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "test") {
      console.error("[Redis] connection error:", err.message);
    }
  });
  return client;
}

// Shared singleton — used for rate limiting and general key/value ops.
// NOT used by BullMQ workers (they get dedicated connections via createBullMQConnection).
export const redis: Redis =
  process.env.NODE_ENV === "production"
    ? createRedisClient(true)
    : (globalThis._redis ??= createRedisClient(true));

/**
 * Returns a fresh, dedicated Redis connection suitable for BullMQ queues and
 * workers.  BullMQ uses blocking commands (BLPOP, BRPOP) and subscriber mode
 * that are incompatible with sharing a connection used for regular commands.
 */
export function createBullMQConnection(): Redis {
  return createRedisClient(false); // not lazy — BullMQ needs it ready immediately
}

export async function getRedisStatus(): Promise<"ok" | "error"> {
  try {
    // Ensure the lazy client is connected before we ping.
    if (redis.status === "wait" || redis.status === "close") {
      await redis.connect();
    }
    await redis.ping();
    return "ok";
  } catch {
    return "error";
  }
}
