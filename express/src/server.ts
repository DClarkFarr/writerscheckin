import dotenv from "dotenv";
import express from "express";
import path from "path";
import { CronJob } from "cron";

dotenv.config({ path: [".env.local", ".env"] });

import { ensureModelIndexes } from "./models/ensureIndexes";
import { app } from "./utils/app";

import { apiRouter } from "./routers/apiRouter";
import { uploadRouter } from "./routers/uploadRouter";
import { webRouter } from "./routers/webRouter";
import QueueService from "./services/QueueService";
import { PublishScheduledMeetings } from "./jobs/PublishScheduledMeetings";

const startServer = async () => {
  app.setupEnvironment();

  app.setupSecurity();

  app.setupCors();

  app.setupCookies();

  await app.setupDatabase();
  await ensureModelIndexes();

  app.setupSessions();

  app.api.use("/api", apiRouter);
  app.api.use("/uploads", uploadRouter);
  app.api.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.api.use(webRouter);

  await app.listen();

  /**
   * Setup cronjob
   */
  initCronJobs();
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});

const initCronJobs = () => {
  const queueService = new QueueService();

  const publishScheduledMeetingsJob = new CronJob(
    "*/1 * * * *", // every fifteen minutes
    function () {
      console.info("Enqueuing scheduled meetings publisher");
      queueService.add(async () => {
        console.info("Running scheduled meetings publisher");
        try {
          await PublishScheduledMeetings.execute();
        } catch (err) {
          console.error("Error executing PublishScheduledMeetings job:", err);
        }
      });
    },
    "America/Denver", // MST
  );
};
