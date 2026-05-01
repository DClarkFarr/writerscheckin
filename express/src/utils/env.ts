export type AppMode = "development" | "production" | "test";

export interface EnvConfig {
  readonly PORT: number;
  readonly MODE: AppMode;
  readonly MONGO_URL: string;
  readonly MONGO_USER: string;
  readonly MONGO_DB: string;
  readonly MONGO_PW: string;
  readonly SESSION_SECRET: string;
  readonly SESSION_COOKIE_NAME: string;
  readonly MAILER_GMAIL_USER: string;
  readonly MAILER_GMAIL_PASS: string;
  readonly MAILER_FROM_EMAIL: string;
  readonly MAILER_FROM_NAME: string;
}

const DEFAULT_ENV: EnvConfig = {
  PORT: 1000,
  MODE: "development",
  MONGO_URL: "",
  MONGO_USER: "",
  MONGO_DB: "",
  MONGO_PW: "",
  SESSION_SECRET: "",
  SESSION_COOKIE_NAME: "plotstack.sid",
  MAILER_GMAIL_USER: "",
  MAILER_GMAIL_PASS: "",
  MAILER_FROM_EMAIL: "no-reply@plotstack.danielsjunk.com",
  MAILER_FROM_NAME: "Team Plotstack",
};

let currentEnv: EnvConfig = { ...DEFAULT_ENV };

export const env: Readonly<EnvConfig> = new Proxy({} as EnvConfig, {
  get: (_target, prop: keyof EnvConfig) => currentEnv[prop],
  ownKeys: () => Reflect.ownKeys(currentEnv),
  getOwnPropertyDescriptor: () => ({
    enumerable: true,
    configurable: false,
  }),
});

export interface ConfigureEnvInput {
  PORT?: number | string | undefined;
  MODE?: AppMode | string | undefined;
  MONGO_URL?: string | undefined;
  MONGO_USER?: string | undefined;
  MONGO_DB?: string | undefined;
  MONGO_PW?: string | undefined;
  SESSION_SECRET?: string | undefined;
  SESSION_COOKIE_NAME?: string | undefined;
  MAILER_GMAIL_USER?: string | undefined;
  MAILER_GMAIL_PASS?: string | undefined;
  MAILER_FROM_EMAIL?: string | undefined;
  MAILER_FROM_NAME?: string | undefined;
}

const parsePort = (value: number | string | undefined): number => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return DEFAULT_ENV.PORT;
};

const parseMode = (value: AppMode | string | undefined): AppMode => {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  return DEFAULT_ENV.MODE;
};

const parseMongoUrl = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MONGO_URL;
};

const parseMongoUser = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MONGO_USER;
};

const parseMongoDb = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MONGO_DB;
};

const parseMongoPw = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MONGO_PW;
};

const parseSessionSecret = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.SESSION_SECRET;
};

const parseSessionCookieName = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.SESSION_COOKIE_NAME;
};

const parseMailerGmailUser = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MAILER_GMAIL_USER;
};

const parseMailerGmailPass = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MAILER_GMAIL_PASS;
};

const parseMailerFromEmail = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MAILER_FROM_EMAIL;
};

const parseMailerFromName = (value: string | undefined): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_ENV.MAILER_FROM_NAME;
};

export const configureEnv = (
  input: ConfigureEnvInput = {},
): Readonly<EnvConfig> => {
  currentEnv = {
    PORT: parsePort(input.PORT),
    MODE: parseMode(input.MODE),
    MONGO_URL: parseMongoUrl(input.MONGO_URL),
    MONGO_USER: parseMongoUser(input.MONGO_USER),
    MONGO_DB: parseMongoDb(input.MONGO_DB),
    MONGO_PW: parseMongoPw(input.MONGO_PW),
    SESSION_SECRET: parseSessionSecret(input.SESSION_SECRET),
    SESSION_COOKIE_NAME: parseSessionCookieName(input.SESSION_COOKIE_NAME),
    MAILER_GMAIL_USER: parseMailerGmailUser(input.MAILER_GMAIL_USER),
    MAILER_GMAIL_PASS: parseMailerGmailPass(input.MAILER_GMAIL_PASS),
    MAILER_FROM_EMAIL: parseMailerFromEmail(input.MAILER_FROM_EMAIL),
    MAILER_FROM_NAME: parseMailerFromName(input.MAILER_FROM_NAME),
  };

  return env;
};
