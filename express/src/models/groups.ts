import { Collection, ObjectId, type Filter } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  activeRecordFilter,
  assertDurationMinutes,
  assertNonNegativeInteger,
  assertRecurrenceRule,
  assertTimeOfDay,
  MeetingTimeOfDay,
  RecurrenceRule,
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

export interface GroupDefinition extends BaseModelBlueprint {
  name: string;
  description: string;
  publishEmailMessage: string;
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  address: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  recurrenceRule: RecurrenceRule;
  deletedAt?: Date;
}

export type GroupBlueprint = ModelBlueprint<GroupDefinition>;
export type GroupDocument = ModelDocument<GroupDefinition>;

export interface CreateGroupInput {
  name: string;
  description?: string;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  address?: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  recurrenceRule: RecurrenceRule;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore?: number;
  notifyAttendanceHoursBefore?: number;
  address?: string;
  startTime?: MeetingTimeOfDay;
  durationMinutes?: number;
  recurrenceRule?: RecurrenceRule;
}

export interface UpdateGroupEmailTemplatesInput {
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
}

interface GroupMemberRecipientProjection {
  _id: ObjectId;
  userId?: ObjectId;
  email?: string;
}

interface UserRecipientProjection {
  _id: ObjectId;
  email: string;
}

export interface GroupResponsibleAdminRecipient {
  groupId: string;
  groupName: string;
  groupDescription: string;
  recipientUserId: string | null;
  recipientEmail: string | null;
}

export const getGroupsCollection = (): Collection<GroupDocument> =>
  getCollection<GroupDocument>(COLLECTIONS.groups);

export const ensureGroupIndexes = async (): Promise<void> => {
  const collection = getGroupsCollection();
  await collection.createIndex({ deletedAt: 1, createdAt: -1 });
  await collection.createIndex({ deletedAt: 1, createdAt: -1, name: 1 });
  await collection.createIndex({ "recurrenceRule.frequency": 1, deletedAt: 1 });
};

const normalizeString = (value: string): string => value.trim();

const normalizeCreateInput = (input: CreateGroupInput): GroupDefinition => {
  const name = normalizeString(input.name);

  if (!name) {
    throw new Error("Group name is required.");
  }

  assertTimeOfDay(input.startTime);
  assertDurationMinutes(input.durationMinutes);
  assertNonNegativeInteger(input.publishHoursBefore, "publishHoursBefore");
  assertNonNegativeInteger(
    input.notifyAttendanceHoursBefore,
    "notifyAttendanceHoursBefore",
  );

  return {
    name,
    description: normalizeString(input.description ?? ""),
    publishEmailMessage: normalizeString(input.publishEmailMessage ?? ""),
    attendanceEmailMessage: normalizeString(input.attendanceEmailMessage ?? ""),
    publishHoursBefore: input.publishHoursBefore,
    notifyAttendanceHoursBefore: input.notifyAttendanceHoursBefore,
    address: normalizeString(input.address ?? ""),
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    recurrenceRule: assertRecurrenceRule(input.recurrenceRule),
  };
};

const normalizeUpdateInput = (
  updates: UpdateGroupInput,
): Partial<GroupDefinition> => {
  const normalized: Partial<GroupDefinition> = {};

  if (typeof updates.name === "string") {
    const name = normalizeString(updates.name);

    if (!name) {
      throw new Error("Group name is required.");
    }

    normalized.name = name;
  }

  if (typeof updates.description === "string") {
    normalized.description = normalizeString(updates.description);
  }

  if (typeof updates.publishEmailMessage === "string") {
    normalized.publishEmailMessage = normalizeString(
      updates.publishEmailMessage,
    );
  }

  if (typeof updates.attendanceEmailMessage === "string") {
    normalized.attendanceEmailMessage = normalizeString(
      updates.attendanceEmailMessage,
    );
  }

  if (typeof updates.address === "string") {
    normalized.address = normalizeString(updates.address);
  }

  if (typeof updates.publishHoursBefore === "number") {
    assertNonNegativeInteger(updates.publishHoursBefore, "publishHoursBefore");
    normalized.publishHoursBefore = updates.publishHoursBefore;
  }

  if (typeof updates.notifyAttendanceHoursBefore === "number") {
    assertNonNegativeInteger(
      updates.notifyAttendanceHoursBefore,
      "notifyAttendanceHoursBefore",
    );
    normalized.notifyAttendanceHoursBefore =
      updates.notifyAttendanceHoursBefore;
  }

  if (updates.startTime) {
    assertTimeOfDay(updates.startTime);
    normalized.startTime = updates.startTime;
  }

  if (typeof updates.durationMinutes === "number") {
    assertDurationMinutes(updates.durationMinutes);
    normalized.durationMinutes = updates.durationMinutes;
  }

  if (updates.recurrenceRule) {
    normalized.recurrenceRule = assertRecurrenceRule(updates.recurrenceRule);
  }

  return normalized;
};

export const createGroup = async (
  input: CreateGroupInput,
): Promise<GroupDocument> => {
  const collection = getGroupsCollection();
  const group = normalizeCreateInput(input);

  const payload: ModelInsertInput<GroupDefinition> = {
    ...group,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as GroupDocument,
  );
  return { ...payload, _id: result.insertedId };
};

export const getGroupById = async (
  id: string | ObjectId,
): Promise<GroupDocument | null> => {
  const collection = getGroupsCollection();

  return collection.findOne({
    _id: toObjectId(id, "groupId"),
    ...activeRecordFilter(),
  });
};

export interface ListGroupsByIdsProps {
  groupIds: (string | ObjectId)[];
  limit?: number;
  includeDeleted?: boolean;
}

export const listGroupsByIds = async ({
  limit,
  includeDeleted,
  groupIds,
}: ListGroupsByIdsProps) => {
  const collection = getGroupsCollection();
  const filter: Filter<GroupDocument> = {
    ...activeRecordFilter(includeDeleted),
    _id: {
      $in: groupIds.map((id) => toObjectId(id, "groupId")),
    },
  };

  const groups = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit ?? 0)
    .toArray();

  return groups;
};

export const updateGroupById = async (
  id: string | ObjectId,
  updates: UpdateGroupInput,
): Promise<GroupDocument | null> => {
  const collection = getGroupsCollection();
  const normalized = normalizeUpdateInput(updates);

  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupId"),
      ...activeRecordFilter(),
    },
    { $set: { ...normalized, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const updateGroupEmailTemplatesById = async (
  id: string | ObjectId,
  updates: UpdateGroupEmailTemplatesInput,
): Promise<GroupDocument | null> => {
  const patch: UpdateGroupInput = {
    ...(typeof updates.publishEmailMessage === "string"
      ? { publishEmailMessage: updates.publishEmailMessage }
      : {}),
    ...(typeof updates.attendanceEmailMessage === "string"
      ? { attendanceEmailMessage: updates.attendanceEmailMessage }
      : {}),
  };

  if (Object.keys(patch).length === 0) {
    return getGroupById(id);
  }

  return updateGroupById(id, patch);
};

export const getGroupResponsibleAdminRecipientById = async (
  id: string | ObjectId,
): Promise<GroupResponsibleAdminRecipient | null> => {
  const group = await getGroupById(id);
  if (!group) {
    return null;
  }

  const groupMembersCollection = getCollection<GroupMemberRecipientProjection>(
    COLLECTIONS.groupMembers,
  );
  const usersCollection = getCollection<UserRecipientProjection>(
    COLLECTIONS.users,
  );

  const ownerMembership = await groupMembersCollection.findOne({
    groupId: group._id,
    role: "owner",
    ...activeRecordFilter(),
  });

  let recipientEmail: string | null = ownerMembership?.email ?? null;
  if (ownerMembership?.userId) {
    const ownerUser = await usersCollection.findOne({
      _id: ownerMembership.userId,
    });

    if (ownerUser?.email) {
      recipientEmail = ownerUser.email;
    }
  }

  return {
    groupId: group._id.toHexString(),
    groupName: group.name,
    groupDescription: group.description,
    recipientUserId: ownerMembership?.userId?.toHexString() ?? null,
    recipientEmail,
  };
};

export const softDeleteGroupById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getGroupsCollection();

  const result = await collection.updateOne(
    {
      _id: toObjectId(id, "groupId"),
      ...activeRecordFilter(),
    },
    {
      $set: softDeletePatch(),
    },
  );

  return result.modifiedCount === 1;
};
