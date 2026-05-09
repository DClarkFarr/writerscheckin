import crypto from "crypto";
import {
  getGroupMemberById,
  getGroupOwnerByGroupId,
} from "../models/groupMembers";
import { getLatestUpcomingMeetingByGroupId } from "../models/groupMeetings";
import { getGroupById } from "../models/groups";
import { getUserById } from "../models/users";
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
  meetingRecurrence: string;
  groupOwnerName: string;
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

const formatMeetingRecurrence = (
  frequency: string,
  daysOfWeek: number[],
  startTime: { hours: number; minutes: number },
): string => {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const sortedDays = [...daysOfWeek].sort();
  const dayLabels = sortedDays.map((day) => dayNames[day] || `Day ${day}`);

  // Format time as "1PM", "2:30PM", etc.
  const hours = startTime.hours % 12 || 12;
  const minutes = startTime.minutes;
  const period = startTime.hours >= 12 ? "PM" : "AM";
  const timeStr =
    minutes === 0
      ? `${hours}${period}`
      : `${hours}:${String(minutes).padStart(2, "0")}${period}`;

  if (frequency === "weekly") {
    if (dayLabels.length === 1) {
      return `Meets every ${dayLabels[0]} at ${timeStr}`;
    } else if (dayLabels.length === 2) {
      return `Meets every ${dayLabels[0]} and ${dayLabels[1]} at ${timeStr}`;
    } else {
      const last = dayLabels.pop();
      return `Meets every ${dayLabels.join(", ")}, and ${last} at ${timeStr}`;
    }
  } else if (frequency === "biweekly") {
    if (dayLabels.length === 1) {
      return `Meets every other ${dayLabels[0]} at ${timeStr}`;
    } else if (dayLabels.length === 2) {
      return `Meets every other ${dayLabels[0]} and ${dayLabels[1]} at ${timeStr}`;
    } else {
      const last = dayLabels.pop();
      return `Meets every other ${dayLabels.join(", ")}, and ${last} at ${timeStr}`;
    }
  }

  return "Meeting schedule TBD";
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

  // Fetch the group owner to include their name
  const ownerMembership = await getGroupOwnerByGroupId(group._id);
  let groupOwnerName = "Group Owner";

  if (ownerMembership?.userId) {
    const ownerUser = await getUserById(ownerMembership.userId);
    if (ownerUser) {
      groupOwnerName = `${ownerUser.firstName} ${ownerUser.lastName}`.trim();
    }
  } else if (ownerMembership?.email) {
    groupOwnerName = ownerMembership.email;
  }

  const meetingRecurrence = formatMeetingRecurrence(
    group.recurrenceRule.frequency,
    group.recurrenceRule.daysOfWeek,
    group.startTime,
  );

  return {
    membershipId: membership._id.toHexString(),
    groupId: group._id.toHexString(),
    groupName: group.name,
    address: group.address,
    nextMeetingStartsAt: nextMeeting?.occursAt
      ? nextMeeting.occursAt.toISOString()
      : null,
    meetingRecurrence,
    groupOwnerName,
    status,
    canAccept: status === "pending",
    canDecline: status === "pending",
  };
};
