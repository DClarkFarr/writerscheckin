import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { Db } from "mongodb";
import session from "express-session";
import { configureEnv, env } from "./env";
import { connectToMongo } from "./mongo";
import { setDb } from "./db";
import { MongoSessionStore } from "./sessionStore";

class App {
  private static instance: App | null = null;
  public readonly api: Application;
  public db: Db | null = null;

  private constructor() {
    this.api = express();
  }

  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }

    return App.instance;
  }

  public setupSessions(): void {
    if (!env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is not configured.");
    }

    if (env.MODE === "production") {
      // Trust the first reverse proxy hop so secure cookies can be set over HTTPS.
      this.api.set("trust proxy", 1);
    }

    const sessionOptions = this.getSessionOptions();

    this.api.use(session(sessionOptions));
  }

  public setupCookies(): void {
    this.api.use(cookieParser());
  }

  public setupSecurity(): void {
    this.api.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    );
  }

  public setupCors(): void {
    const allowedOrigins = this.getCorsAllowedOrigins();

    this.api.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(
            new Error(
              `CORS blocked for origin: ${origin}. Allowed origins: ${allowedOrigins.join(
                ", ",
              )}`,
            ),
          );
        },
        credentials: true,
      }),
    );
  }

  public listen(): void {
    const port = env.PORT;

    this.api.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  }

  public setupEnvironment() {
    configureEnv({
      MODE: process.env.MODE,
      PORT: process.env.PORT,
      MONGO_URL: process.env.MONGO_URL,
      MONGO_USER: process.env.MONGO_USER,
      MONGO_DB: process.env.MONGO_DB,
      MONGO_PW: process.env.MONGO_PW,
      SESSION_SECRET: process.env.SESSION_SECRET,
      SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
      MAILER_GMAIL_USER: process.env.MAILER_GMAIL_USER,
      MAILER_GMAIL_PASS: process.env.MAILER_GMAIL_PASS,
      MAILER_FROM_EMAIL: process.env.MAILER_FROM_EMAIL,
      MAILER_FROM_NAME: process.env.MAILER_FROM_NAME,
    });
  }

  public async setupDatabase(): Promise<void> {
    const mongoUrl = this.resolveMongoUrl();
    /**
     * Example via URL
     * mongodb://username:password@127.0.0.1:27017/your_database_name
     *
     * Example via parts (host defaults to 127.0.0.1:27017)
     * MONGO_USER=your_username
     * MONGO_DB=your_database_name
     * MONGO_PW=your_password
     */

    if (!mongoUrl) {
      throw new Error(
        "MongoDB is not configured. Set MONGO_URL or set MONGO_USER, MONGO_DB, and MONGO_PW.",
      );
    }

    const connectionTimeoutMs = 5000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(
          new Error("MongoDB connection attempt timed out after 5 seconds."),
        );
      }, connectionTimeoutMs);
    });

    try {
      this.db = await Promise.race([connectToMongo(mongoUrl), timeoutPromise]);
      setDb(this.db);
      console.log("MongoDB connection succeeded.");
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("MongoDB connection attempt failed.");
    }
  }

  private getCorsAllowedOrigins(): string[] {
    if (env.MODE === "production") {
      return ["https://plotstack.danielsjunk.com"];
    }

    return ["http://localhost:5173", "http://localhost:4000"];
  }

  private getSessionOptions(): session.SessionOptions {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const inactivityWindowMs = 7 * oneDayMs;

    return {
      name: env.SESSION_COOKIE_NAME,
      secret: env.SESSION_SECRET,
      store: new MongoSessionStore(),
      proxy: env.MODE === "production",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.MODE === "production",
        maxAge: inactivityWindowMs,
      },
    };
  }

  private resolveMongoUrl(): string {
    if (env.MONGO_URL) {
      return env.MONGO_URL;
    }

    if (env.MONGO_USER && env.MONGO_DB && env.MONGO_PW) {
      const username = encodeURIComponent(env.MONGO_USER);
      const password = encodeURIComponent(env.MONGO_PW);
      const database = encodeURIComponent(env.MONGO_DB);

      return `mongodb://${username}:${password}@127.0.0.1:27017/${database}`;
    }

    return "";
  }
}

export const app = App.getInstance();
