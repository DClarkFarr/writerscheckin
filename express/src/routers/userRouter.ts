import express, { Request } from "express";
import { type AuthSession } from "../services/authService";
import { handleAsync } from "../utils/asyncHandler";
import {
  changePasswordForSessionUser,
  updateProfileForSessionUser,
} from "../services/userProfileService";

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
      email: req.body?.email,
    });

    res.status(200).json(data);
  }),
);

userRouter.put(
  "/password",
  handleAsync(async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    const data = await changePasswordForSessionUser(
      userId,
      {
        currentPassword: req.body?.currentPassword,
        newPassword: req.body?.newPassword,
        newPasswordConfirm: req.body?.newPasswordConfirm,
        email: req.body?.email,
      },
      req.sessionID,
      req.ip ?? "unknown",
    );

    res.status(200).json(data);
  }),
);
