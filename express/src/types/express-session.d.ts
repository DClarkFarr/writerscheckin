import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    session: import("express-session").Session &
      import("express-session").SessionData;
  }
}
