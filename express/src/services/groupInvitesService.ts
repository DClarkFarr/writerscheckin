import crypto from "crypto";
import { getGroupMemberById } from "../models/groupMembers";
import { getLatestUpcomingMeetingByGroupId } from "../models/groupMeetings";
import { getGroupById } from "../models/groups";
import { env } from "../utils/env";

export type JoinGroupInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "invalid";

export interface JoinGroupInviteDetails {
  membershipId: string;
  groupId: string;
  groupName: string;
  address: string;
  nextMeetingStartsAt: string | null;
  status: JoinGroupInviteStatus;
  canAccept: boolean;
  canDecline: boolean;
}

interface InviteTokenPayload {
  membershipId: string;
  issuedAt: string;
}

const getInviteTokenSecret = (): string => {
  const secret = env.SESSION_SECRET.trim();
  if (secret.length === 0) {
    throw new Error("Invite token secret is not configured.");
  }

  return secret;
};

const signPayload = (encodedPayload: string): string => {
  return crypto
    .createHmac("sha256", getInviteTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
};

const encodePayload = (payload: InviteTokenPayload): string => {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
};

const decodePayload = (encodedPayload: string): InviteTokenPayload => {
  const decoded = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded) as Partial<InviteTokenPayload>;

  if (
    typeof parsed.membershipId !== "string" ||
    parsed.membershipId.trim().length === 0 ||
    typeof parsed.issuedAt !== "string"
  ) {
    throw new Error("Invalid invite token payload.");
  }

  return {
    membershipId: parsed.membershipId,
    issuedAt: parsed.issuedAt,
  };
};

export const createInviteToken = (membershipId: string): string => {
  const trimmedMembershipId = membershipId.trim();
  if (trimmedMembershipId.length === 0) {
    throw new Error("membershipId is required.");
  }

  const encodedPayload = encodePayload({
    membershipId: trimmedMembershipId,
    issuedAt: new Date().toISOString(),
  });

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
};

export const verifyInviteToken = (
  membershipId: string,
  token: string,
): InviteTokenPayload => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid invite token format.");
  }

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Invalid invite token signature.");
  }

  const payload = decodePayload(encodedPayload);
  if (payload.membershipId !== membershipId) {
    throw new Error("Invite token does not match membership.");
  }

  return payload;
};

const toJoinInviteStatus = (
  membershipStatus: string,
): JoinGroupInviteStatus => {
  if (membershipStatus === "invited") {
    return "pending";
  }

  if (membershipStatus === "accepted" || membershipStatus === "declined") {
    return membershipStatus;
  }

  if (membershipStatus === "cancelled" || membershipStatus === "removed") {
    return "expired";
  }

  return "invalid";
};

export const getJoinGroupInviteDetails = async (
  membershipId: string,
  inviteToken: string,
): Promise<JoinGroupInviteDetails> => {
  const trimmedMembershipId = membershipId.trim();
  if (trimmedMembershipId.length === 0) {
    throw new Error("membershipId is required.");
  }

  verifyInviteToken(trimmedMembershipId, inviteToken);

  const membership = await getGroupMemberById(trimmedMembershipId);
  if (!membership) {
    throw new Error("Group invite not found.");
  }

  const group = await getGroupById(membership.groupId);
  if (!group) {
    throw new Error("Group invite not found.");
  }

  const nextMeeting = await getLatestUpcomingMeetingByGroupId(group._id);
  const status = toJoinInviteStatus(membership.status);

  return {
    membershipId: membership._id.toHexString(),
    groupId: group._id.toHexString(),
    groupName: group.name,
    address: group.address,
    nextMeetingStartsAt: nextMeeting?.occursAt
      ? nextMeeting.occursAt.toISOString()
      : null,
    status,
    canAccept: status === "pending",
    canDecline: status === "pending",
  };
};
