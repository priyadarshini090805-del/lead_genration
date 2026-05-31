import { Worker, Job } from "bullmq";
import { createBullMQConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { notificationQueue, type ContentJobData } from "../lib/queues";
import { logger } from "../lib/logger";

export function startContentWorker() {
  const worker = new Worker<ContentJobData>(
    "content",
    async (job: Job<ContentJobData>) => {
      const { scheduledTaskId, userId, contentId, platform } = job.data;

      logger.info(`[content] processing job ${job.id}`, { scheduledTaskId, contentId });

      // Mark content as published
      await prisma.content.update({
        where: { id: contentId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      // Mark task as sent
      await prisma.scheduledTask.update({
        where: { id: scheduledTaskId },
        data: { status: "SENT", executedAt: new Date() },
      });

      // Success notification
      await notificationQueue.add("notify", {
        userId,
        title: "Content published",
        message: `Your content has been published to ${platform}.`,
        type: "CONTENT_PUBLISHED",
        metadata: { contentId, scheduledTaskId },
      });

      logger.info(`[content] job ${job.id} completed`);
    },
    { connection: createBullMQConnection() }
  );

  worker.on("failed", async (job, err) => {
    logger.error(`[content] job ${job?.id} failed: ${err.message}`);
    if (job?.data?.scheduledTaskId) {
      await prisma.scheduledTask
        .update({
          where: { id: job.data.scheduledTaskId },
          data: { status: "FAILED", lastError: err.message },
        })
        .catch(() => null);

      await notificationQueue
        .add("notify", {
          userId: job.data.userId,
          title: "Content publish failed",
          message: `Could not publish content: ${err.message}`,
          type: "CONTENT_FAILED",
          metadata: { scheduledTaskId: job.data.scheduledTaskId },
        })
        .catch(() => null);
    }
  });

  return worker;
}
