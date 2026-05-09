import express from "express";
import { handleAsync } from "../utils/asyncHandler";
import { getJoinGroupInviteDetails } from "../services/groupInvitesService";

export const groupInvitesRouter = express.Router({ mergeParams: true });

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
