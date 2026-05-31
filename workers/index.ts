import { startOutreachWorker } from "./outreach.worker";
import { startContentWorker } from "./content.worker";
import { startNotificationWorker } from "./notification.worker";
import { logger } from "../lib/logger";

logger.info("Starting Hanexis background workers...");

const outreachWorker = startOutreachWorker();
const contentWorker = startContentWorker();
const notificationWorker = startNotificationWorker();

async function shutdown() {
  logger.info("Shutting down workers...");
  await Promise.all([outreachWorker.close(), contentWorker.close(), notificationWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
logger.info("All workers running.");
