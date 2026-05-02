import { Collection, ObjectId } from "mongodb";
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

export interface GroupMemberInvite {
  invitedBy: ObjectId;
  invitedAt: Date;
  invitedUser: ObjectId;
  status: GroupMemberInviteStatus;
  statusChangedAt: Date;
}

export interface GroupMemberDefinition extends BaseModelBlueprint {
  groupId: ObjectId;
  userId: ObjectId;
  role: GroupMemberRole;
  invite: GroupMemberInvite;
  deletedAt?: Date;
}

export type GroupMemberBlueprint = ModelBlueprint<GroupMemberDefinition>;
export type GroupMemberDocument = ModelDocument<GroupMemberDefinition>;

export const getGroupMembersCollection = (): Collection<GroupMemberDocument> =>
  getCollection<GroupMemberDocument>(COLLECTIONS.groupMembers);

export const ensureGroupMemberIndexes = async (): Promise<void> => {
  const collection = getGroupMembersCollection();
  await collection.createIndex({ groupId: 1, role: 1, deletedAt: 1 });
  await collection.createIndex({ groupId: 1, userId: 1 }, { unique: true });
  await collection.createIndex(
    { groupId: 1, role: 1 },
    {
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
  userId: string | ObjectId;
  role: GroupMemberRole;
  invite: {
    invitedBy: string | ObjectId;
    invitedAt: Date;
    invitedUser: string | ObjectId;
    status: GroupMemberInviteStatus;
    statusChangedAt: Date;
  };
}

export interface SaveGroupMemberInput {
  groupId: string | ObjectId;
  userId: string | ObjectId;
  role: GroupMemberRole;
  invite: {
    invitedBy: string | ObjectId;
    invitedAt?: Date;
    invitedUser?: string | ObjectId;
    status: GroupMemberInviteStatus;
    statusChangedAt?: Date;
  };
}

export interface UpdateGroupMemberInput {
  role?: GroupMemberRole;
  invite?: {
    status?: GroupMemberInviteStatus;
    statusChangedAt?: Date;
  };
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

export const createGroupMember = async (
  input: CreateGroupMemberInput,
): Promise<GroupMemberDocument> => {
  const collection = getGroupMembersCollection();
  const groupId = toObjectId(input.groupId, "groupId");
  const userId = toObjectId(input.userId, "userId");
  const role = assertRole(input.role);
  const inviteStatus = assertInviteStatus(input.invite.status);

  await assertOneOwnerIfRoleOwner(groupId, role);

  const payload: ModelInsertInput<GroupMemberDefinition> = {
    groupId,
    userId,
    role,
    invite: {
      invitedBy: toObjectId(input.invite.invitedBy, "invitedBy"),
      invitedAt: input.invite.invitedAt,
      invitedUser: toObjectId(input.invite.invitedUser, "invitedUser"),
      status: inviteStatus,
      statusChangedAt: input.invite.statusChangedAt,
    },
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
  const userId = toObjectId(input.userId, "userId");
  const role = assertRole(input.role);
  const inviteStatus = assertInviteStatus(input.invite.status);
  const invitedAt = input.invite.invitedAt ?? new Date();
  const statusChangedAt = input.invite.statusChangedAt ?? invitedAt;
  const existing = await collection.findOne({ groupId, userId });

  await assertOneOwnerIfRoleOwner(groupId, role, existing?._id);

  const result = await collection.findOneAndUpdate(
    {
      groupId,
      userId,
    },
    {
      $set: {
        role,
        invite: {
          invitedBy: toObjectId(input.invite.invitedBy, "invitedBy"),
          invitedAt,
          invitedUser: toObjectId(
            input.invite.invitedUser ?? userId,
            "invitedUser",
          ),
          status: inviteStatus,
          statusChangedAt,
        },
        ...touchTimestamps(),
      },
      $setOnInsert: {
        groupId,
        userId,
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

  if (updates.invite) {
    const invitePatch = { ...current.invite };

    if (typeof updates.invite.status === "string") {
      const nextStatus = assertInviteStatus(updates.invite.status);
      assertInviteStatusTransition(current.invite.status, nextStatus);
      invitePatch.status = nextStatus;
      invitePatch.statusChangedAt =
        updates.invite.statusChangedAt ?? new Date();
    }

    updatePayload.invite = invitePatch;
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
