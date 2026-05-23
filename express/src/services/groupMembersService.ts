import { ObjectId } from "mongodb";
import {
  getGroupMemberById,
  getGroupMemberByIdForUser,
  getMembershipByGroup,
  getUserGroupMembership,
  getEmailGroupMembership,
  listGroupMembersByEmail,
  listGroupMembersByGroupId,
  saveGroupMember,
  softDeleteGroupMemberById,
  updateGroupMemberById,
  type GroupMemberNotificationType,
  type GroupMemberUnsubscribedNotifications,
  type GroupMemberDocument,
} from "../models/groupMembers";
import { listEligiblePublishedMeetingsForMembershipBackfill } from "../models/groupMeetings";
import {
  assertRole,
  type GroupMemberInviteStatus,
  type GroupMemberRole,
} from "../models/groupModelCommon";
import { createMeetingAttendeeIfMissing } from "../models/meetingAttendees";
import { getUserByEmail, getUserById, normalizeEmail } from "../models/users";
import { ensureObjectId } from "../models/types";
import { validateEmail } from "../utils/validators";
import { sendEmail } from "./emailService";
import { buildGroupInviteEmail } from "./emailTemplates/groupInviteEmail";
import { getGroupById } from "../models/groups";
import { createInviteToken } from "./groupInvitesService";

export interface AddGroupMemberInput {
  groupId: string;
  identifier: string;
  role: GroupMemberRole;
  invitedBy: string | null;
  status?: GroupMemberInviteStatus;
}

export interface UpdateGroupMemberRoleInput {
  groupId: string;
  memberId: string;
  role: GroupMemberRole;
}

export interface RemoveGroupMemberInput {
  groupId: string;
  memberId: string;
}

export type GroupInviteResponseAction = "accept" | "decline";

export interface RespondToGroupInviteInput {
  membershipId: string;
  userId: string;
  action: GroupInviteResponseAction;
}

export interface RespondToGroupInviteResult {
  membershipId: string;
  groupId: string;
  status: "accepted" | "declined";
  actedAt: string;
  redirectTo: string | null;
}

export interface GroupMemberNotificationSettingsResponse {
  groupId: string;
  membershipId: string;
  unsubscribedNotifications: GroupMemberUnsubscribedNotifications;
  updatedAt: string;
}

export interface UpdateGroupMemberNotificationSettingsInput {
  groupId: string;
  userId: string;
  notificationType: GroupMemberNotificationType;
  unsubscribed: boolean;
}

export interface GetGroupMemberNotificationSettingsInput {
  groupId: string;
  userId: string;
}

export interface MembershipActivationBackfillResult {
  membershipId: string;
  groupId: string;
  evaluatedMeetingCount: number;
  attendeeCreatedCount: number;
  attendeeExistingCount: number;
}

const isObjectIdLike = (value: string): boolean => ObjectId.isValid(value);

const assertMemberBelongsToGroup = async (
  groupId: string,
  memberId: string,
): Promise<GroupMemberDocument> => {
  const member = await getGroupMemberById(memberId);

  if (!member || member.groupId.toHexString() !== groupId) {
    throw new Error("Group member not found.");
  }

  return member;
};

const resolveIdentifier = async (
  identifier: string,
): Promise<{
  userId?: string;
  email: string;
}> => {
  const trimmed = identifier.trim();

  if (isObjectIdLike(trimmed)) {
    const user = await getUserById(trimmed);
    if (!user) {
      throw new Error("User not found.");
    }

    return {
      userId: user._id.toHexString(),
      email: user.email,
    };
  }

  const email = validateEmail(trimmed);
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return {
      userId: existingUser._id.toHexString(),
      email: existingUser.email,
    };
  }

  return {
    email,
  };
};

export const backfillMeetingAttendeesForAcceptedMembership = async (
  membership: GroupMemberDocument,
): Promise<MembershipActivationBackfillResult> => {
  const membershipId = membership._id.toHexString();
  const groupId = membership.groupId.toHexString();

  if (membership.status !== "accepted") {
    return {
      membershipId,
      groupId,
      evaluatedMeetingCount: 0,
      attendeeCreatedCount: 0,
      attendeeExistingCount: 0,
    };
  }

  const meetings = await listEligiblePublishedMeetingsForMembershipBackfill(
    membership.groupId,
    { limit: 1000 },
  );

  let attendeeCreatedCount = 0;
  let attendeeExistingCount = 0;

  for (const meeting of meetings) {
    const attendeeResult = await createMeetingAttendeeIfMissing({
      meetingId: meeting._id,
      memberId: membership._id,
      status: "invited",
    });

    if (attendeeResult.created) {
      attendeeCreatedCount += 1;
    } else {
      attendeeExistingCount += 1;
    }
  }

  return {
    membershipId,
    groupId,
    evaluatedMeetingCount: meetings.length,
    attendeeCreatedCount,
    attendeeExistingCount,
  };
};

export const addGroupMember = async (
  input: AddGroupMemberInput,
): Promise<GroupMemberDocument> => {
  const role = assertRole(input.role);
  const resolved = await resolveIdentifier(input.identifier);

  const existingMember = resolved.userId
    ? await getUserGroupMembership(resolved.userId, input.groupId)
    : await getEmailGroupMembership(resolved.email, input.groupId);

  const now = new Date();
  // if the user has set the status, leave it unchanged.
  // If status was set by admin, let this update it.

  const group = await getGroupById(input.groupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  if (["accepted"].includes(existingMember?.status ?? "")) {
    // abort
    throw new Error("Member already accepted.");
  }

  const nextStatus = input.status ?? "invited";
  const acceptedAt =
    nextStatus === "accepted" ? (existingMember?.acceptedAt ?? now) : undefined;

  const saved = await saveGroupMember({
    groupId: input.groupId,
    ...(resolved.userId ? { userId: resolved.userId } : {}),
    email: resolved.email,
    role,
    invitedBy: input.invitedBy ?? null,
    invitedAt: existingMember?.invitedAt ?? now,
    ...(acceptedAt ? { acceptedAt } : {}),
    status: nextStatus,
  });

  if (nextStatus === "invited") {
    const membershipId = saved._id.toHexString();
    const inviteToken = createInviteToken(membershipId);
    const inviteEmail = buildGroupInviteEmail(
      membershipId,
      inviteToken,
      group.name,
    );

    sendEmail({
      to: resolved.email,
      subject: inviteEmail.subject,
      text: inviteEmail.text,
      html: inviteEmail.html,
    }).catch(() => {
      // Best-effort — do not fail the invite if email delivery fails
    });
  }

  if (saved.status === "accepted") {
    await backfillMeetingAttendeesForAcceptedMembership(saved);
  }

  return saved;
};

export const getGroupMembers = async (
  groupId: string,
): Promise<GroupMemberDocument[]> =>
  listGroupMembersByGroupId(groupId, { limit: 500 });

export const updateGroupMemberRole = async (
  input: UpdateGroupMemberRoleInput,
): Promise<GroupMemberDocument> => {
  assertRole(input.role);
  await assertMemberBelongsToGroup(input.groupId, input.memberId);

  const updated = await updateGroupMemberById(input.memberId, {
    role: input.role,
  });

  if (!updated) {
    throw new Error("Unable to update group member role.");
  }

  return updated;
};

export const removeGroupMember = async (
  input: RemoveGroupMemberInput,
): Promise<void> => {
  await assertMemberBelongsToGroup(input.groupId, input.memberId);

  const updated = await updateGroupMemberById(input.memberId, {
    status: "removed",
  });

  if (!updated) {
    throw new Error("Unable to update group member status.");
  }

  await softDeleteGroupMemberById(input.memberId);
};

export const respondToGroupInvite = async (
  input: RespondToGroupInviteInput,
): Promise<RespondToGroupInviteResult> => {
  const membership = await getGroupMemberByIdForUser(
    input.membershipId,
    input.userId,
  );

  if (!membership) {
    throw new Error("Group member not found.");
  }

  if (membership.status !== "invited") {
    throw new Error("Invite has already been handled.");
  }

  const nextStatus = input.action === "accept" ? "accepted" : "declined";
  const actedAt = new Date();
  const updated = await updateGroupMemberById(membership._id, {
    status: nextStatus,
    ...(nextStatus === "accepted" ? { acceptedAt: actedAt } : {}),
  });

  if (!updated) {
    throw new Error("Unable to respond to group invite.");
  }

  if (updated.status === "accepted") {
    await backfillMeetingAttendeesForAcceptedMembership(updated);
  }

  const groupId = updated.groupId.toHexString();

  return {
    membershipId: updated._id.toHexString(),
    groupId,
    status: nextStatus,
    actedAt: (updated.updatedAt ?? actedAt).toISOString(),
    redirectTo: nextStatus === "accepted" ? `/groups/${groupId}/view` : null,
  };
};

export const attachUserToInvitedMembers = async (
  email: string,
  userId: string,
): Promise<GroupMemberDocument[]> => {
  const normalizedEmail = normalizeEmail(email);
  const resolvedUserId = ensureObjectId(userId, "userId").toHexString();
  const invitedMembers = await listGroupMembersByEmail(normalizedEmail, {
    limit: 500,
  });
  const attachedAt = new Date();
  const updatedMembers: GroupMemberDocument[] = [];

  for (const member of invitedMembers) {
    if (member.status !== "invited") {
      continue;
    }

    const updated = await updateGroupMemberById(member._id, {
      userId: resolvedUserId,
      acceptedAt: attachedAt,
      status: "accepted",
    });

    if (updated) {
      if (updated.status === "accepted") {
        await backfillMeetingAttendeesForAcceptedMembership(updated);
      }
      updatedMembers.push(updated);
    }
  }

  return updatedMembers;
};

export const groupMemberDocumentToResponse = (doc: GroupMemberDocument) => {
  return {
    membershipId: doc._id.toHexString(),
    userId: doc.userId?.toHexString() ?? null,
    email: doc.email,
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    invitedBy: doc.invitedBy?.toHexString() ?? null,
    invitedAt: doc.invitedAt?.toISOString() ?? null,
    acceptedAt: doc.acceptedAt?.toISOString() ?? null,
  };
};

export const groupMemberNotificationSettingsToResponse = (
  doc: GroupMemberDocument,
): GroupMemberNotificationSettingsResponse => {
  return {
    groupId: doc.groupId.toHexString(),
    membershipId: doc._id.toHexString(),
    unsubscribedNotifications: doc.unsubscribedNotifications ?? {},
    updatedAt: (doc.updatedAt ?? doc.createdAt).toISOString(),
  };
};

export const getGroupMemberNotificationSettings = async ({
  groupId,
  userId,
}: GetGroupMemberNotificationSettingsInput): Promise<GroupMemberNotificationSettingsResponse> => {
  const membership = await getMembershipByGroup(userId, groupId);
  if (!membership || membership.status !== "accepted") {
    throw new Error("Group member not found.");
  }

  return groupMemberNotificationSettingsToResponse(membership);
};

export const isGroupMemberUnsubscribedFromNotification = (
  membership: Pick<GroupMemberDocument, "unsubscribedNotifications">,
  notificationType: GroupMemberNotificationType,
): boolean => {
  return Boolean(membership.unsubscribedNotifications?.[notificationType]);
};

export const updateGroupMemberNotificationSettings = async ({
  groupId,
  userId,
  notificationType,
  unsubscribed,
}: UpdateGroupMemberNotificationSettingsInput): Promise<GroupMemberNotificationSettingsResponse> => {
  const membership = await getMembershipByGroup(userId, groupId);
  if (!membership || membership.status !== "accepted") {
    throw new Error("Group member not found.");
  }

  const updated = await updateGroupMemberById(membership._id, {
    updateUnsubscribedNotification: {
      notificationType,
      unsubscribed,
    },
  });

  if (!updated) {
    throw new Error("Unable to update group member notification settings.");
  }

  return groupMemberNotificationSettingsToResponse(updated);
};
