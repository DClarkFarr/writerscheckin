import express, { Request } from "express";
import { type AuthSession } from "../services/authService";
import { handleAsync } from "../utils/asyncHandler";
import { updateProfileForSessionUser } from "../services/userProfileService";

export const userRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

export const getAuthenticatedUserId = (req: Request): string => {
  const sessionData = getSession(req);
  const userId = sessionData.userId;

  if (!userId) {
    throw new Error("Unauthorized userId required.");
  }

  return userId;
};

userRouter.patch(
  "/profile",
  handleAsync(async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    const data = await updateProfileForSessionUser(userId, {
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
    });

    res.status(200).json(data);
  }),
);
