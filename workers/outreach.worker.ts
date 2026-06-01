import { Worker, Job } from "bullmq";
import { createBullMQConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { notificationQueue, type OutreachJobData } from "../lib/queues";
import { logger } from "../lib/logger";

export function startOutreachWorker() {
  const worker = new Worker<OutreachJobData>(
    "outreach",
    async (job: Job<OutreachJobData>) => {
      const { scheduledTaskId, userId, leadId, message, platform, type } = job.data;

      logger.info(`[outreach] processing job ${job.id}`, { scheduledTaskId, leadId });

      // Create the sent message record
      await prisma.message.create({
        data: {
          content: message,
          type,
          status: "SENT",
          sentAt: new Date(),
          platform,
          leadId,
          userId,
        },
      });

      // Update lead status
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONTACTED" },
      });

      // Mark scheduled task as sent
      await prisma.scheduledTask.update({
        where: { id: scheduledTaskId },
        data: { status: "SENT", executedAt: new Date() },
      });

      // Fire success notification
      await notificationQueue.add("notify", {
        userId,
        title: "Follow-up sent",
        message: `Follow-up message delivered via ${platform}.`,
        type: "MESSAGE_SENT",
        metadata: { leadId, scheduledTaskId },
      });

      logger.info(`[outreach] job ${job.id} completed`);
    },
    { connection: createBullMQConnection() as any }
  );

  worker.on("failed", async (job, err) => {
    logger.error(`[outreach] job ${job?.id} failed: ${err.message}`);
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
          title: "Follow-up failed",
          message: `Could not deliver message: ${err.message}`,
          type: "MESSAGE_FAILED",
          metadata: { scheduledTaskId: job.data.scheduledTaskId },
        })
        .catch(() => null);
    }
  });

  return worker;
}
