import { Queue } from "bullmq";
import { createBullMQConnection } from "./redis";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};

// Each queue gets its own dedicated Redis connection.
// BullMQ uses BLPOP / subscribe internally — sharing connections with regular
// Redis commands (ping, INCR, …) causes "Connection is in subscriber mode" errors.
export const leadQueue = new Queue("lead", {
  connection: createBullMQConnection() as any,
  defaultJobOptions,
});

export const outreachQueue = new Queue("outreach", {
  connection: createBullMQConnection() as any,
  defaultJobOptions,
});

export const contentQueue = new Queue("content", {
  connection: createBullMQConnection() as any,
  defaultJobOptions,
});

export const notificationQueue = new Queue("notification", {
  connection: createBullMQConnection() as any,
  defaultJobOptions: { ...defaultJobOptions, attempts: 5 },
});

// ── Job type definitions ────────────────────────────────────────────────────

export type OutreachJobData = {
  scheduledTaskId: string;
  userId: string;
  leadId: string;
  message: string;
  platform: string;
  type: string;
};

export type ContentJobData = {
  scheduledTaskId: string;
  userId: string;
  contentId: string;
  platform: string;
};

export type NotificationJobData = {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
};

export async function getQueueStats() {
  const [outreachCounts, contentCounts, notifCounts] = await Promise.all([
    outreachQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
    contentQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
    notificationQueue.getJobCounts("waiting", "active", "completed", "failed"),
  ]);
  return {
    outreach: outreachCounts,
    content: contentCounts,
    notifications: notifCounts,
  };
}
