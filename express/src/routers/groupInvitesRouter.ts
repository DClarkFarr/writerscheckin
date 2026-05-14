import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import {
  getJoinGroupInviteDetails,
  respondToMeetingInviteDecision,
  respondToJoinGroupInvite,
} from "../services/groupInvitesService";
import { type AuthSession } from "../services/authService";

export const groupInvitesRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

const getRouteParam = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
};

groupInvitesRouter.get(
  "/:membershipId",
  handleAsync(async (req, res) => {
    const membershipId = getRouteParam(req.params.membershipId, "membershipId");
    const inviteToken = getRouteParam(req.query.inviteToken, "inviteToken");

    const data = await getJoinGroupInviteDetails(membershipId, inviteToken);
    res.status(200).json(data);
  }),
);

groupInvitesRouter.post(
  "/meeting-links/respond",
  handleAsync(async (req, res) => {
    const groupId = getRouteParam(req.body?.groupId, "groupId");
    const meetingId = getRouteParam(req.body?.meetingId, "meetingId");
    const decision = getRouteParam(req.body?.decision, "decision");

    if (decision !== "accept" && decision !== "decline") {
      throw new Error("Invalid invite decision.");
    }

    const sessionData = getSession(req);
    if (!sessionData.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const data = await respondToMeetingInviteDecision({
      groupId,
      meetingId,
      userId: sessionData.userId,
      decision,
    });

    res.status(200).json(data);
  }),
);

groupInvitesRouter.post(
  "/:membershipId/respond",
  handleAsync(async (req, res) => {
    const membershipId = getRouteParam(req.params.membershipId, "membershipId");
    const inviteToken = getRouteParam(req.body?.inviteToken, "inviteToken");
    const action = getRouteParam(req.body?.action, "action");

    if (action !== "accept" && action !== "decline") {
      throw new Error("Invalid invite action.");
    }

    const sessionData = getSession(req);
    if (action === "accept" && !sessionData.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const data = await respondToJoinGroupInvite({
      membershipId,
      inviteToken,
      action,
      ...(sessionData.userId ? { userId: sessionData.userId } : {}),
    });

    res.status(200).json(data);
  }),
);
