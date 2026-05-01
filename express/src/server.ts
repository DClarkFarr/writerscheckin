import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config({ path: [".env.local", ".env"] });

import { app } from "./utils/app";

import { apiRouter } from "./routers/apiRouter";
import { uploadRouter } from "./routers/uploadRouter";
import { webRouter } from "./routers/webRouter";

const startServer = async () => {
  app.setupEnvironment();

  app.setupSecurity();

  app.setupCors();

  app.setupCookies();

  await app.setupDatabase();

  app.setupSessions();

  app.api.use("/api", apiRouter);
  app.api.use("/uploads", uploadRouter);
  app.api.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.api.use(webRouter);

  app.listen();
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
