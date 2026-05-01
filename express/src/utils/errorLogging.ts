import type { Request, Response } from "express";

export type ErrorLogContext = {
  referenceId: string;
  timestamp: string;
  method: string;
  route: string;
  statusCode: number;
};

const stackLinePattern = /\(([^)]+):(\d+):(\d+)\)$|at\s+([^\s]+):(\d+):(\d+)$/;

const getStackSource = (stack?: string) => {
  if (!stack) {
    return undefined;
  }

  const lines = stack.split("\n").map((line) => line.trim());
  for (const line of lines) {
    if (!line || line.includes("node:internal")) {
      continue;
    }

    const match = stackLinePattern.exec(line);
    if (!match) {
      continue;
    }

    const file = match[1] ?? match[4];
    const lineNumber = match[2] ?? match[5];
    const columnNumber = match[3] ?? match[6];

    if (file && lineNumber && columnNumber) {
      return `${file}:${lineNumber}:${columnNumber}`;
    }
  }

  return undefined;
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      source: getStackSource(error.stack),
    };
  }

  try {
    return { name: "NonError", message: JSON.stringify(error) };
  } catch {
    return { name: "NonError", message: String(error) };
  }
};

export const logError = (error: unknown, context: ErrorLogContext) => {
  const payload = {
    referenceId: context.referenceId,
    timestamp: context.timestamp,
    method: context.method,
    route: context.route,
    ...formatError(error),
  };

  if (context.statusCode >= 500) {
    console.error("API Error", payload);
    return;
  }

  console.warn("API Warning", payload);
};

export const getRequestContext = (req: Request, res: Response) => ({
  referenceId: res.locals.requestId ?? "unknown",
  timestamp: new Date().toISOString(),
  method: req.method,
  route: req.originalUrl,
});
