import { ObjectId } from "mongodb";
import {
  getGroupMemberById,
  getUserGroupMembership,
  getEmailGroupMembership,
  listGroupMembersByEmail,
  listGroupMembersByGroupId,
  saveGroupMember,
  softDeleteGroupMemberById,
  updateGroupMemberById,
  type GroupMemberDocument,
} from "../models/groupMembers";
import {
  assertRole,
  type GroupMemberInviteStatus,
  type GroupMemberRole,
} from "../models/groupModelCommon";
import { getUserByEmail, getUserById, normalizeEmail } from "../models/users";
import { ensureObjectId } from "../models/types";
import { validateEmail } from "../utils/validators";
import { sendEmail } from "./emailService";

export interface AddGroupMemberInput {
  groupId: string;
  identifier: string;
  role: GroupMemberRole;
  invitedBy: string;
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

  const nextStatus =
    (["accepted", "declined"].includes(existingMember?.status ?? "")
      ? existingMember?.status
      : input.status) ?? "invited";
  const acceptedAt =
    nextStatus === "accepted" ? (existingMember?.acceptedAt ?? now) : undefined;

  const saved = await saveGroupMember({
    groupId: input.groupId,
    ...(resolved.userId ? { userId: resolved.userId } : {}),
    email: resolved.email,
    role,
    invitedBy: input.invitedBy,
    invitedAt: existingMember?.invitedAt ?? now,
    ...(acceptedAt ? { acceptedAt } : {}),
    status: nextStatus,
  });

  if (nextStatus === "invited") {
    sendEmail({
      to: resolved.email,
      subject: "You've been invited to a writers group",
      text: `You've been invited to join a writers group on Writers CheckIn. Sign up to accept the invitation.`,
      html: `<p>You've been invited to join a writers group on <strong>Writers CheckIn</strong>.</p><p>Sign up to accept the invitation.</p>`,
    }).catch(() => {
      // Best-effort — do not fail the invite if email delivery fails
    });
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
