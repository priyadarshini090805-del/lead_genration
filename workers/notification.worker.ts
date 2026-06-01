import { Worker, Job } from "bullmq";
import { createBullMQConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { type NotificationJobData } from "../lib/queues";
import { logger } from "../lib/logger";

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    "notification",
    async (job: Job<NotificationJobData>) => {
      const { userId, title, message, type, metadata } = job.data;

      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      logger.info(`[notification] created ${type} for user ${userId}`);
    },
    { connection: createBullMQConnection() as any }
  );

  worker.on("failed", (job, err) => {
    logger.error(`[notification] job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
