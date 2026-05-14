import crypto from "crypto";
import {
  getGroupMemberById,
  getMembershipInviteByGroupAndUserId,
  getGroupOwnerByGroupId,
  updateGroupMemberById,
  UpdateGroupMemberInput,
} from "../models/groupMembers";
import {
  getGroupMeetingById,
  getLatestUpcomingMeetingByGroupId,
} from "../models/groupMeetings";
import { getGroupById } from "../models/groups";
import { getUserById, normalizeEmail, UserDocument } from "../models/users";
import { AuthError } from "./authService";
import { env } from "../utils/env";

export const INVITE_LINK_ACCESS_STATES = [
  "active_member",
  "pending_invite",
  "not_invited",
  "declined_or_left",
  "removed",
  "unknown_or_expired",
] as const;

export type InviteLinkAccessState = (typeof INVITE_LINK_ACCESS_STATES)[number];

export const INVITE_LINK_ACTIONS = [
  "accept_invite",
  "decline_invite",
  "request_to_join",
  "none",
] as const;

export type InviteLinkAction = (typeof INVITE_LINK_ACTIONS)[number];

export const INVITE_LINK_MESSAGE_KEY_BY_STATE: Record<
  InviteLinkAccessState,
  string
> = {
  active_member: "inviteLink.activeMember",
  pending_invite: "inviteLink.pendingInvite",
  not_invited: "inviteLink.notInvited",
  declined_or_left: "inviteLink.declinedOrLeft",
  removed: "inviteLink.removed",
  unknown_or_expired: "inviteLink.unknownOrExpired",
};

export const INVITE_LINK_ACTIONS_BY_STATE: Record<
  InviteLinkAccessState,
  InviteLinkAction[]
> = {
  active_member: ["none"],
  pending_invite: ["accept_invite", "decline_invite"],
  not_invited: ["none"],
  declined_or_left: ["request_to_join"],
  removed: ["request_to_join"],
  unknown_or_expired: ["none"],
};

export interface ResolveInviteLinkAccessStateInput {
  membershipStatus?: string | null;
  membershipExists: boolean;
}

export const resolveInviteLinkAccessState = ({
  membershipStatus,
  membershipExists,
}: ResolveInviteLinkAccessStateInput): InviteLinkAccessState => {
  if (!membershipExists) {
    return "not_invited";
  }

  if (membershipStatus === "accepted") {
    return "active_member";
  }

  if (membershipStatus === "invited") {
    return "pending_invite";
  }

  if (membershipStatus === "declined" || membershipStatus === "cancelled") {
    return "declined_or_left";
  }

  if (membershipStatus === "removed") {
    return "removed";
  }

  return "unknown_or_expired";
};

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

export type JoinGroupInviteAction = "accept" | "decline";

export interface RespondToJoinGroupInviteInput {
  membershipId: string;
  inviteToken: string;
  action: JoinGroupInviteAction;
  userId?: string;
}

export interface RespondToJoinGroupInviteResult {
  membershipId: string;
  groupId: string;
  status: "accepted" | "declined";
  actedAt: string;
  redirectTo: string;
}

export interface RespondToMeetingInviteDecisionInput {
  groupId: string;
  meetingId: string;
  userId: string;
  decision: "accept" | "decline";
}

export interface RespondToMeetingInviteDecisionResult {
  updatedState: InviteLinkAccessState;
  messageKey: string;
  canProceedToMeeting: boolean;
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

export const respondToJoinGroupInvite = async (
  input: RespondToJoinGroupInviteInput,
): Promise<RespondToJoinGroupInviteResult> => {
  const membershipId = input.membershipId.trim();
  if (membershipId.length === 0) {
    throw new Error("membershipId is required.");
  }

  verifyInviteToken(membershipId, input.inviteToken);

  const membership = await getGroupMemberById(membershipId);
  if (!membership) {
    throw new Error("Group invite not found.");
  }

  if (membership.status !== "invited") {
    throw new Error("Invite has already been handled.");
  }

  let user: UserDocument | null = null;
  if (input.action === "accept") {
    if (!input.userId) {
      throw new AuthError("Unauthorized", 401);
    }

    user = await getUserById(input.userId);
    if (!user) {
      throw new AuthError("Unauthorized", 401);
    }
  }

  const nextStatus = input.action === "accept" ? "accepted" : "declined";
  const actedAt = new Date();

  const toSet: UpdateGroupMemberInput = {
    status: nextStatus,
    ...(user ? { userId: user._id, email: user.email } : {}),
    ...(nextStatus === "accepted" ? { acceptedAt: actedAt } : {}),
  };

  const updated = await updateGroupMemberById(membership._id, toSet);

  if (!updated) {
    throw new Error("Unable to respond to group invite.");
  }

  return {
    membershipId: updated._id.toHexString(),
    groupId: updated.groupId.toHexString(),
    status: nextStatus,
    actedAt: (updated.updatedAt ?? actedAt).toISOString(),
    redirectTo: nextStatus === "accepted" ? "/" : "",
  };
};

export const respondToMeetingInviteDecision = async (
  input: RespondToMeetingInviteDecisionInput,
): Promise<RespondToMeetingInviteDecisionResult> => {
  const meeting = await getGroupMeetingById(input.meetingId);
  if (!meeting || meeting.groupId.toHexString() !== input.groupId) {
    throw new Error("Meeting not found.");
  }

  const membership = await getMembershipInviteByGroupAndUserId({
    userId: input.userId,
    groupId: input.groupId,
  });

  const currentState = resolveInviteLinkAccessState({
    membershipStatus: membership?.status ?? null,
    membershipExists: Boolean(membership),
  });

  if (currentState !== "pending_invite") {
    // Idempotent behavior for duplicate submissions.
    if (currentState === "active_member" && input.decision === "accept") {
      return {
        updatedState: currentState,
        messageKey: INVITE_LINK_MESSAGE_KEY_BY_STATE[currentState],
        canProceedToMeeting: true,
      };
    }

    if (currentState === "declined_or_left" && input.decision === "decline") {
      return {
        updatedState: currentState,
        messageKey: INVITE_LINK_MESSAGE_KEY_BY_STATE[currentState],
        canProceedToMeeting: false,
      };
    }

    throw new Error("Invite is no longer pending.");
  }

  if (!membership) {
    throw new Error("Invite is no longer pending.");
  }

  const nextStatus = input.decision === "accept" ? "accepted" : "declined";
  const actedAt = new Date();
  const updatePatch: UpdateGroupMemberInput = {
    status: nextStatus,
    ...(nextStatus === "accepted" ? { acceptedAt: actedAt } : {}),
  };

  const updated = await updateGroupMemberById(membership._id, updatePatch);
  if (!updated) {
    throw new Error("Unable to update invite status.");
  }

  const updatedState = resolveInviteLinkAccessState({
    membershipStatus: updated.status,
    membershipExists: true,
  });

  return {
    updatedState,
    messageKey: INVITE_LINK_MESSAGE_KEY_BY_STATE[updatedState],
    canProceedToMeeting: updatedState === "active_member",
  };
};
