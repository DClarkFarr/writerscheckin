import { Collection, ObjectId } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  activeRecordFilter,
  assertDurationMinutes,
  GroupMeetingStatus,
  MeetingTimeOfDay,
  assertMeetingStatus,
  assertNonNegativeInteger,
  assertTimeOfDay,
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

export interface GroupMeetingDefinition extends BaseModelBlueprint {
  groupId: ObjectId;
  name: string;
  occursAt: Date;
  description: string;
  emailMessage: string;
  address: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  publishEmailMessage: string;
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: GroupMeetingStatus;
  deletedAt?: Date;
}

export type GroupMeetingBlueprint = ModelBlueprint<GroupMeetingDefinition>;
export type GroupMeetingDocument = ModelDocument<GroupMeetingDefinition>;

export interface CreateGroupMeetingInput {
  groupId: string | ObjectId;
  name: string;
  occursAt?: Date;
  description?: string;
  emailMessage?: string;
  address?: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status?: GroupMeetingStatus;
}

export interface UpdateGroupMeetingInput {
  name?: string;
  occursAt?: Date;
  description?: string;
  emailMessage?: string;
  address?: string;
  startTime?: MeetingTimeOfDay;
  durationMinutes?: number;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore?: number;
  notifyAttendanceHoursBefore?: number;
  status?: GroupMeetingStatus;
}

export interface ListGroupMeetingsOptions {
  includeDeleted?: boolean;
  limit?: number;
}

export interface CountGroupMeetingsOptions {
  includeDeleted?: boolean;
  status?: GroupMeetingStatus;
  onlyPast?: boolean;
  referenceDate?: Date;
}

export const getGroupMeetingsCollection =
  (): Collection<GroupMeetingDocument> =>
    getCollection<GroupMeetingDocument>(COLLECTIONS.groupMeetings);

export const ensureGroupMeetingIndexes = async (): Promise<void> => {
  const collection = getGroupMeetingsCollection();
  await collection.createIndex({
    groupId: 1,
    status: 1,
    deletedAt: 1,
    occursAt: 1,
    createdAt: 1,
  });
};

const normalizeString = (value: string): string => value.trim();

const assertDate = (value: Date, label: string): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`${label} must be a valid datetime.`);
  }

  return value;
};

const normalizeCreateInput = (
  input: CreateGroupMeetingInput,
): GroupMeetingDefinition => {
  const name = normalizeString(input.name);

  if (!name) {
    throw new Error("Meeting name is required.");
  }

  assertTimeOfDay(input.startTime);
  assertDurationMinutes(input.durationMinutes);
  assertNonNegativeInteger(input.publishHoursBefore, "publishHoursBefore");
  assertNonNegativeInteger(
    input.notifyAttendanceHoursBefore,
    "notifyAttendanceHoursBefore",
  );

  return {
    groupId: toObjectId(input.groupId, "groupId"),
    name,
    occursAt: assertDate(input.occursAt ?? new Date(), "occursAt"),
    description: normalizeString(input.description ?? ""),
    emailMessage: normalizeString(input.emailMessage ?? ""),
    address: normalizeString(input.address ?? ""),
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    publishEmailMessage: normalizeString(input.publishEmailMessage ?? ""),
    attendanceEmailMessage: normalizeString(input.attendanceEmailMessage ?? ""),
    publishHoursBefore: input.publishHoursBefore,
    notifyAttendanceHoursBefore: input.notifyAttendanceHoursBefore,
    status: assertMeetingStatus(input.status ?? "draft"),
  };
};

const normalizeUpdateInput = (
  updates: UpdateGroupMeetingInput,
): Partial<GroupMeetingDefinition> => {
  const normalized: Partial<GroupMeetingDefinition> = {};

  if (typeof updates.name === "string") {
    const name = normalizeString(updates.name);

    if (!name) {
      throw new Error("Meeting name is required.");
    }

    normalized.name = name;
  }

  if (updates.occursAt instanceof Date) {
    normalized.occursAt = assertDate(updates.occursAt, "occursAt");
  }

  if (typeof updates.description === "string") {
    normalized.description = normalizeString(updates.description);
  }

  if (typeof updates.emailMessage === "string") {
    normalized.emailMessage = normalizeString(updates.emailMessage);
  }

  if (typeof updates.address === "string") {
    normalized.address = normalizeString(updates.address);
  }

  if (updates.startTime) {
    assertTimeOfDay(updates.startTime);
    normalized.startTime = updates.startTime;
  }

  if (typeof updates.durationMinutes === "number") {
    assertDurationMinutes(updates.durationMinutes);
    normalized.durationMinutes = updates.durationMinutes;
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

  if (typeof updates.status === "string") {
    normalized.status = assertMeetingStatus(updates.status);
  }

  return normalized;
};

export const createGroupMeeting = async (
  input: CreateGroupMeetingInput,
): Promise<GroupMeetingDocument> => {
  const collection = getGroupMeetingsCollection();
  const meeting = normalizeCreateInput(input);
  const payload: ModelInsertInput<GroupMeetingDefinition> = {
    ...meeting,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as GroupMeetingDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const getGroupMeetingById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();

  return collection.findOne({
    _id: toObjectId(id, "groupMeetingId"),
    ...activeRecordFilter(),
  });
};

export const listGroupMeetingsByGroupId = async (
  groupId: string | ObjectId,
  options: ListGroupMeetingsOptions = {},
): Promise<GroupMeetingDocument[]> => {
  const collection = getGroupMeetingsCollection();
  const limit = options.limit ?? 200;

  return collection
    .find({
      groupId: toObjectId(groupId, "groupId"),
      ...activeRecordFilter(options.includeDeleted),
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

export const countGroupMeetingsByGroupId = async (
  groupId: string | ObjectId,
  options: CountGroupMeetingsOptions = {},
): Promise<number> => {
  const collection = getGroupMeetingsCollection();
  const referenceDate = options.referenceDate ?? new Date();

  return collection.countDocuments({
    groupId: toObjectId(groupId, "groupId"),
    ...activeRecordFilter(options.includeDeleted),
    ...(options.status ? { status: assertMeetingStatus(options.status) } : {}),
    ...(options.onlyPast
      ? {
          $or: [
            { occursAt: { $lt: referenceDate } },
            { occursAt: { $exists: false } },
          ],
        }
      : {}),
  });
};

export const getNextUpcomingMeetingByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const now = new Date();

  const meetingWithOccurrence = await collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      status: "draft",
      occursAt: { $gte: now },
      ...activeRecordFilter(),
    },
    {
      sort: { occursAt: 1, createdAt: 1 },
    },
  );

  if (meetingWithOccurrence) {
    return meetingWithOccurrence;
  }

  return collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      status: "draft",
      ...activeRecordFilter(),
    },
    {
      sort: { createdAt: -1 },
    },
  );
};

export const getLatestUpcomingMeetingByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const now = new Date();

  const meetingWithOccurrence = await collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      occursAt: { $gte: now },
      ...activeRecordFilter(),
    },
    {
      sort: { occursAt: -1, createdAt: -1 },
    },
  );

  return meetingWithOccurrence;
};

export const updateGroupMeetingById = async (
  id: string | ObjectId,
  updates: UpdateGroupMeetingInput,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const normalized = normalizeUpdateInput(updates);

  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    { $set: { ...normalized, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const publishGroupMeetingById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: {
        status: assertMeetingStatus("published"),
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const softDeleteGroupMeetingById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.updateOne(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: softDeletePatch(),
    },
  );

  return result.modifiedCount === 1;
};

export { toObjectId };
