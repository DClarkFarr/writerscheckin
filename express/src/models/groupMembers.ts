import { Collection, ObjectId } from "mongodb";
import { normalizeEmail } from "./users";
import { COLLECTIONS, getCollection } from "./collections";
import {
  activeRecordFilter,
  GroupMemberInviteStatus,
  GroupMemberRole,
  assertInviteStatus,
  assertInviteStatusTransition,
  assertRole,
  softDeletePatch,
  toObjectId,
} from "./groupModelCommon";
import {
  BaseModelBlueprint,
  createTimestamps,
  ModelBlueprint,
  ModelDocument,
  ModelInsertInput,
  touchTimestamps,
} from "./types";

export interface GroupMemberDefinition extends BaseModelBlueprint {
  groupId: ObjectId;
  userId?: ObjectId;
  email?: string;
  role: GroupMemberRole;
  invitedBy: ObjectId;
  invitedAt: Date;
  acceptedAt?: Date;
  status: GroupMemberInviteStatus;
  deletedAt?: Date;
}

export type GroupMemberBlueprint = ModelBlueprint<GroupMemberDefinition>;
export type GroupMemberDocument = ModelDocument<GroupMemberDefinition>;

export const getGroupMembersCollection = (): Collection<GroupMemberDocument> =>
  getCollection<GroupMemberDocument>(COLLECTIONS.groupMembers);

export const ensureGroupMemberIndexes = async (): Promise<void> => {
  const collection = getGroupMembersCollection();
  await collection.createIndex({ groupId: 1, role: 1, deletedAt: 1 });
  await collection.createIndex(
    { groupId: 1, userId: 1 },
    {
      name: "groupId_userId_unique",
      unique: true,
      partialFilterExpression: {
        userId: { $exists: true },
      },
    },
  );
  await collection.createIndex(
    { groupId: 1, email: 1 },
    {
      name: "groupId_email_unique",
      unique: true,
      partialFilterExpression: {
        email: { $exists: true },
      },
    },
  );
  await collection.createIndex({ email: 1, deletedAt: 1 });
  await collection.createIndex({ status: 1, deletedAt: 1 });
  await collection.createIndex(
    { groupId: 1, role: 1 },
    {
      name: "groupId_role_owner_unique",
      unique: true,
      partialFilterExpression: {
        role: "owner",
        deletedAt: null,
      },
    },
  );
};

export interface CreateGroupMemberInput {
  groupId: string | ObjectId;
  userId?: string | ObjectId;
  email?: string;
  role: GroupMemberRole;
  invitedBy: string | ObjectId;
  invitedAt: Date;
  acceptedAt?: Date;
  status: GroupMemberInviteStatus;
}

export interface SaveGroupMemberInput {
  groupId: string | ObjectId;
  userId?: string | ObjectId;
  email?: string;
  role: GroupMemberRole;
  invitedBy: string | ObjectId;
  invitedAt?: Date;
  acceptedAt?: Date;
  status: GroupMemberInviteStatus;
}

export interface UpdateGroupMemberInput {
  userId?: string | ObjectId;
  email?: string | null;
  role?: GroupMemberRole;
  invitedBy?: string | ObjectId;
  invitedAt?: Date;
  acceptedAt?: Date | null;
  status?: GroupMemberInviteStatus;
}

export interface ListGroupMembersOptions {
  includeDeleted?: boolean;
  limit?: number;
}

const assertOneOwnerIfRoleOwner = async (
  groupId: ObjectId,
  role: GroupMemberRole,
  excludeId?: ObjectId,
): Promise<void> => {
  if (role !== "owner") {
    return;
  }

  const collection = getGroupMembersCollection();
  const existingOwner = await collection.findOne({
    groupId,
    role: "owner",
    deletedAt: { $exists: false },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  if (existingOwner) {
    throw new Error("Each group can only have one active owner.");
  }
};

const normalizeOptionalObjectId = (
  value: string | ObjectId | undefined,
  label: string,
): ObjectId | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return toObjectId(value, label);
};

const normalizeOptionalEmail = (
  email: string | undefined,
): string | undefined => {
  if (email === undefined) {
    return undefined;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error(
      "Email is required when creating an email-based group member.",
    );
  }

  return normalizedEmail;
};

const assertMemberIdentifier = (
  userId: ObjectId | undefined,
  email: string | undefined,
): void => {
  if (!userId && !email) {
    throw new Error("Group members must include either a userId or email.");
  }
};

const buildMemberFilter = (
  groupId: ObjectId,
  userId: ObjectId | undefined,
  email: string | undefined,
): { groupId: ObjectId; userId?: ObjectId; email?: string } => {
  if (userId) {
    return { groupId, userId };
  }

  if (email) {
    return { groupId, email };
  }

  return { groupId };
};

export const createGroupMember = async (
  input: CreateGroupMemberInput,
): Promise<GroupMemberDocument> => {
  const collection = getGroupMembersCollection();
  const groupId = toObjectId(input.groupId, "groupId");
  const userId = normalizeOptionalObjectId(input.userId, "userId");
  const email = normalizeOptionalEmail(input.email);
  const role = assertRole(input.role);
  const status = assertInviteStatus(input.status);
  assertMemberIdentifier(userId, email);

  await assertOneOwnerIfRoleOwner(groupId, role);

  const payload: ModelInsertInput<GroupMemberDefinition> = {
    groupId,
    ...(userId ? { userId } : {}),
    ...(email ? { email } : {}),
    role,
    invitedBy: toObjectId(input.invitedBy, "invitedBy"),
    invitedAt: input.invitedAt,
    ...(input.acceptedAt ? { acceptedAt: input.acceptedAt } : {}),
    status,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as GroupMemberDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const saveGroupMember = async (
  input: SaveGroupMemberInput,
): Promise<GroupMemberDocument> => {
  const collection = getGroupMembersCollection();
  const groupId = toObjectId(input.groupId, "groupId");
  const userId = normalizeOptionalObjectId(input.userId, "userId");
  const email = normalizeOptionalEmail(input.email);
  const role = assertRole(input.role);
  const status = assertInviteStatus(input.status);
  const invitedAt = input.invitedAt ?? new Date();
  const acceptedAt = input.acceptedAt;
  assertMemberIdentifier(userId, email);
  const existing = await collection.findOne(
    buildMemberFilter(groupId, userId, email),
  );

  await assertOneOwnerIfRoleOwner(groupId, role, existing?._id);

  const result = await collection.findOneAndUpdate(
    buildMemberFilter(groupId, userId, email),
    {
      $set: {
        ...(userId ? { userId } : {}),
        ...(email ? { email } : {}),
        role,
        invitedBy: toObjectId(input.invitedBy, "invitedBy"),
        invitedAt,
        ...(acceptedAt ? { acceptedAt } : {}),
        status,
        ...touchTimestamps(),
      },
      $setOnInsert: {
        groupId,
        ...createTimestamps(),
      },
      $unset: {
        deletedAt: "",
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  if (!result) {
    throw new Error("Unable to save group member.");
  }

  return result;
};

export const getGroupMemberById = async (
  id: string | ObjectId,
): Promise<GroupMemberDocument | null> => {
  const collection = getGroupMembersCollection();

  return collection.findOne({
    _id: toObjectId(id, "groupMemberId"),
    ...activeRecordFilter(),
  });
};
export const getUserGroupMembership = async (
  userId: string | ObjectId,
  groupId: string | ObjectId,
): Promise<GroupMemberDocument | null> => {
  const collection = getGroupMembersCollection();

  return collection.findOne({
    userId: toObjectId(userId, "userId"),
    groupId: toObjectId(groupId, "groupId"),
    ...activeRecordFilter(),
  });
};

export const getEmailGroupMembership = async (
  email: string,
  groupId: string | ObjectId,
): Promise<GroupMemberDocument | null> => {
  const collection = getGroupMembersCollection();

  return collection.findOne({
    email: normalizeEmail(email),
    groupId: toObjectId(groupId, "groupId"),
    ...activeRecordFilter(),
  });
};

export const listGroupMembersByEmail = async (
  email: string,
  options: ListGroupMembersOptions = {},
): Promise<GroupMemberDocument[]> => {
  const collection = getGroupMembersCollection();
  const limit = options.limit ?? 200;

  return collection
    .find({
      email: normalizeEmail(email),
      ...activeRecordFilter(options.includeDeleted),
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
};

export const listGroupMembersByGroupId = async (
  groupId: string | ObjectId,
  options: ListGroupMembersOptions = {},
): Promise<GroupMemberDocument[]> => {
  const collection = getGroupMembersCollection();
  const limit = options.limit ?? 200;

  return collection
    .find({
      groupId: toObjectId(groupId, "groupId"),
      ...activeRecordFilter(options.includeDeleted),
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
};

export const getGroupOwnerByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMemberDocument | null> => {
  const collection = getGroupMembersCollection();

  return collection.findOne({
    groupId: toObjectId(groupId, "groupId"),
    role: "owner",
    ...activeRecordFilter(),
  });
};

export const updateGroupMemberById = async (
  id: string | ObjectId,
  updates: UpdateGroupMemberInput,
): Promise<GroupMemberDocument | null> => {
  const collection = getGroupMembersCollection();
  const groupMemberId = toObjectId(id, "groupMemberId");

  const current = await collection.findOne({
    _id: groupMemberId,
    ...activeRecordFilter(),
  });

  if (!current) {
    return null;
  }

  const updatePayload: Partial<GroupMemberDefinition> = {};

  if (typeof updates.role === "string") {
    const role = assertRole(updates.role);
    await assertOneOwnerIfRoleOwner(current.groupId, role, groupMemberId);
    updatePayload.role = role;
  }

  if (updates.userId !== undefined) {
    updatePayload.userId = toObjectId(updates.userId, "userId");
  }

  if (updates.email !== undefined) {
    if (updates.email !== null) {
      const normalizedEmail = normalizeOptionalEmail(updates.email);
      if (normalizedEmail) {
        updatePayload.email = normalizedEmail;
      }
    }
  }

  if (updates.invitedBy !== undefined) {
    updatePayload.invitedBy = toObjectId(updates.invitedBy, "invitedBy");
  }

  if (updates.invitedAt !== undefined) {
    updatePayload.invitedAt = updates.invitedAt;
  }

  if (updates.acceptedAt !== undefined) {
    if (updates.acceptedAt !== null) {
      updatePayload.acceptedAt = updates.acceptedAt;
    }
  }

  if (typeof updates.status === "string") {
    const nextStatus = assertInviteStatus(updates.status);
    assertInviteStatusTransition(current.status, nextStatus);
    updatePayload.status = nextStatus;
  }

  const result = await collection.findOneAndUpdate(
    {
      _id: groupMemberId,
      ...activeRecordFilter(),
    },
    {
      $set: {
        ...updatePayload,
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const softDeleteGroupMemberById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getGroupMembersCollection();
  const result = await collection.updateOne(
    {
      _id: toObjectId(id, "groupMemberId"),
      ...activeRecordFilter(),
    },
    {
      $set: softDeletePatch(),
    },
  );

  return result.modifiedCount === 1;
};

export const softDeleteGroupMemberByGroupAndUserId = async (
  groupId: string | ObjectId,
  userId: string | ObjectId,
): Promise<boolean> => {
  const collection = getGroupMembersCollection();
  const result = await collection.updateOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      userId: toObjectId(userId, "userId"),
      ...activeRecordFilter(),
    },
    {
      $set: softDeletePatch(),
    },
  );

  return result.modifiedCount === 1;
};

export { assertOneOwnerIfRoleOwner, toObjectId };
