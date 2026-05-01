import type { Request, Response } from "express";
import { AuthError, ValidationError } from "../services/authService";
import { getRequestContext, logError } from "./errorLogging";

type ErrorResolution = {
  status: number;
  message: string;
  field?: string;
};

const resolveError = (error: unknown): ErrorResolution => {
  if (error instanceof AuthError) {
    return { status: error.status, message: error.message };
  }

  if (error instanceof ValidationError) {
    return {
      status: error.status,
      message: error.message,
      field: error.field,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes("not found")) {
      return { status: 404, message: error.message };
    }

    if (error.message.startsWith("Too many attempts")) {
      return { status: 429, message: error.message };
    }

    if (
      error.message.includes("required") ||
      error.message.startsWith("Invalid") ||
      error.message.includes("must") ||
      error.message.includes("unknown")
    ) {
      return { status: 400, message: error.message };
    }

    return { status: 410, message: error.message };
  }

  return { status: 500, message: "Unexpected error" };
};

export const handleError = (req: Request, res: Response, error: unknown) => {
  const resolution = resolveError(error);
  const context = getRequestContext(req, res);
  const shouldLog = !res.locals.errorLogged;

  if (shouldLog) {
    res.locals.errorLogged = true;
    logError(error, { ...context, statusCode: resolution.status });
  }

  if (res.headersSent) {
    return;
  }

  res.status(resolution.status).json({ message: resolution.message, context });
};
