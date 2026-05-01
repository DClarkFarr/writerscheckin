import express, { Request } from "express";
import {
  AuthSession,
  confirmPasswordReset,
  getCurrentUser,
  login,
  requestPasswordReset,
  signup,
} from "../services/authService";
import { handleAsync } from "../utils/asyncHandler";

export const authRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

const applyAuthRoutes = () => {
  authRouter.post(
    "/signup",
    handleAsync(async (req, res) => {
      const ipAddress = req.ip ?? "unknown";
      const sessionData = getSession(req);
      const user = await signup(
        {
          firstName: req.body?.firstName,
          lastName: req.body?.lastName,
          email: req.body?.email,
          password: req.body?.password,
          ipAddress,
        },
        sessionData,
      );

      res.status(201).json({ user });
    }),
  );

  authRouter.post(
    "/login",
    handleAsync(async (req, res) => {
      const ipAddress = req.ip ?? "unknown";
      const sessionData = getSession(req);
      const user = await login(
        {
          email: req.body?.email,
          password: req.body?.password,
          ipAddress,
        },
        sessionData,
      );

      res.status(200).json({ user });
    }),
  );

  authRouter.post(
    "/logout",
    handleAsync(async (req, res) => {
      const sessionData = getSession(req);
      await sessionData.destroy((err) => {
        if (err instanceof Error) {
          console.error("Error destroying session:", err);
        } else {
        }
      });

      res
        .clearCookie("plotstack.sid")
        .status(200)
        .json({ message: "Logged out" });
    }),
  );

  authRouter.post(
    "/reset-password/request",
    handleAsync(async (req, res) => {
      const ipAddress = req.ip ?? "unknown";
      await requestPasswordReset({
        email: req.body?.email,
        ipAddress,
      });

      res.status(200).json({
        message: "If the account exists, instructions have been sent.",
      });
    }),
  );

  authRouter.post(
    "/reset-password/confirm",
    handleAsync(async (req, res) => {
      const ipAddress = req.ip ?? "unknown";
      await confirmPasswordReset({
        email: req.body?.email,
        code: req.body?.code,
        password: req.body?.password,
        ipAddress,
      });

      res.status(200).json({ message: "Password updated" });
    }),
  );

  authRouter.get(
    "/me",
    handleAsync(async (req, res) => {
      const sessionData = getSession(req);
      const user = await getCurrentUser(sessionData);
      res.status(200).json({ user });
    }),
  );
};

applyAuthRoutes();
