import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedisStatus } from "@/lib/redis";
import { getQueueStats } from "@/lib/queues";

export async function GET() {
  const start = Date.now();

  const [dbStatus, redisStatus] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.then(() => "ok").catch(() => "error"),
    getRedisStatus(),
  ]);

  let queueStats = null;
  if (redisStatus.status === "fulfilled" && redisStatus.value === "ok") {
    try { queueStats = await getQueueStats(); } catch { /* non-fatal */ }
  }

  const db = dbStatus.status === "fulfilled" ? dbStatus.value : "error";
  const redis = redisStatus.status === "fulfilled" ? redisStatus.value : "error";
  const healthy = db === "ok";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      services: { database: db, redis, queues: queueStats },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    },
    { status: healthy ? 200 : 503 }
  );
}
