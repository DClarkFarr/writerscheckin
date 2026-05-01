import type { Request, Response } from "express";
import { handleError } from "./errorHandler";

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

export const handleAsync =
  (handler: AsyncHandler): AsyncHandler =>
  async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(req, res, error);
    }
  };

export type { AsyncHandler };
