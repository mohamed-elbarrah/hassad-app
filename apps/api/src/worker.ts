import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { BackupWorkerModule } from "./worker/backup-worker.module";

async function bootstrap() {
  const logger = new Logger("BackupWorker");
  const app = await NestFactory.createApplicationContext(BackupWorkerModule, {
    logger,
  });

  const shutdown = async (signal: string) => {
    logger.log(`Shutting down after ${signal}`);
    await app.close();
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
  logger.log("Backup worker started");
}

bootstrap().catch((error) => {
  console.error("Backup worker failed to start", error);
  process.exit(1);
});
