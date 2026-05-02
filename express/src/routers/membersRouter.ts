import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import { type AuthSession } from "../services/authService";
import { searchMembers } from "../services/memberSearchService";

export const membersRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

const getAuthenticatedUserId = (req: Request): string => {
  const sessionData = getSession(req);
  const userId = sessionData.userId;

  if (!userId) {
    throw new Error("Unauthorized userId required.");
  }

  return userId;
};

membersRouter.get(
  "/search",
  handleAsync(async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const groupId =
      typeof req.query.groupId === "string" ? req.query.groupId : undefined;
    const parsedLimit =
      typeof req.query.limit === "string"
        ? Number.parseInt(req.query.limit, 10)
        : undefined;
    const limit =
      typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
        ? parsedLimit
        : undefined;

    const result = await searchMembers({
      query,
      excludeUserId: userId,
      ...(groupId ? { groupId } : {}),
      ...(typeof limit === "number" ? { limit } : {}),
    });

    res.status(200).json(result);
  }),
);
