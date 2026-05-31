import { NextRequest, NextResponse } from "next/server";
import { redis } from "./redis";

interface RateLimitOptions {
  limit: number;
  window: number; // seconds
  identifier?: (req: NextRequest) => string;
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { limit, window } = options;
  const id = options.identifier
    ? options.identifier(req)
    : req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "global";

  const key = `rl:${req.nextUrl.pathname}:${id}`;

  try {
    // ioredis v5 multi().exec() returns [error | null, result][] — one tuple per command.
    // We must index [commandIndex][1] to get the actual value, not destructure the outer array.
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, window)
      .exec();

    // results?.[0] = [error, incrValue]; results?.[0]?.[1] = the incremented count
    const count = (results?.[0]?.[1] as number) ?? 0;
    const remaining = Math.max(0, limit - count);
    const reset = Math.floor(Date.now() / 1000) + window;

    return { success: count <= limit, remaining, reset };
  } catch {
    // If Redis is unavailable, allow the request through rather than hard-blocking.
    return { success: true, remaining: limit, reset: 0 };
  }
}

export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(reset),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}
