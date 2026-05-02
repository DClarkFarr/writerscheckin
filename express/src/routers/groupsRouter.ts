import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import { AuthSession } from "../services/authService";
import { listMyGroupsSummary } from "../services/groupsService";

export const groupsRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

const applyGroupRoutes = () => {
  groupsRouter.get(
    "/mine",
    handleAsync(async (req, res) => {
      const sessionData = getSession(req);
      const userId = sessionData.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cursor =
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const data = await listMyGroupsSummary({
        userId,
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json({ items: data.items, nextCursor: data.nextCursor });
    }),
  );
};

applyGroupRoutes();
