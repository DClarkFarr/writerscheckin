import { Collection, ObjectId } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  AttendanceLogStatus,
  assertAttendanceLogStatus,
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

export interface MeetingAttendanceLogDefinition extends BaseModelBlueprint {
  groupId: ObjectId;
  memberId: ObjectId;
  userId: ObjectId;
  meetingId: ObjectId;
  status: AttendanceLogStatus;
  notificationSent: boolean;
}

export type MeetingAttendanceLogBlueprint =
  ModelBlueprint<MeetingAttendanceLogDefinition>;
export type MeetingAttendanceLogDocument =
  ModelDocument<MeetingAttendanceLogDefinition>;

export interface CreateMeetingAttendanceLogInput {
  groupId: string | ObjectId;
  memberId: string | ObjectId;
  userId: string | ObjectId;
  meetingId: string | ObjectId;
  status: AttendanceLogStatus;
  notificationSent?: boolean;
}

export interface ListPendingAttendanceLogsOptions {
  limit?: number;
}

export const getMeetingAttendanceLogsCollection =
  (): Collection<MeetingAttendanceLogDocument> =>
    getCollection<MeetingAttendanceLogDocument>(
      COLLECTIONS.meetingAttendanceLogs,
    );

export const ensureMeetingAttendanceLogIndexes = async (): Promise<void> => {
  const collection = getMeetingAttendanceLogsCollection();
  await collection.createIndex({ notificationSent: 1, createdAt: 1 });
  await collection.createIndex({ meetingId: 1, memberId: 1, createdAt: -1 });
};

export const createMeetingAttendanceLog = async (
  input: CreateMeetingAttendanceLogInput,
): Promise<MeetingAttendanceLogDocument> => {
  const collection = getMeetingAttendanceLogsCollection();

  const payload: ModelInsertInput<MeetingAttendanceLogDefinition> = {
    groupId: toObjectId(input.groupId, "groupId"),
    memberId: toObjectId(input.memberId, "memberId"),
    userId: toObjectId(input.userId, "userId"),
    meetingId: toObjectId(input.meetingId, "meetingId"),
    status: assertAttendanceLogStatus(input.status),
    notificationSent: input.notificationSent ?? false,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as MeetingAttendanceLogDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const listPendingAttendanceLogs = async (
  options: ListPendingAttendanceLogsOptions = {},
): Promise<MeetingAttendanceLogDocument[]> => {
  const collection = getMeetingAttendanceLogsCollection();
  const limit = options.limit ?? 200;

  return collection
    .find({ notificationSent: false })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
};

export const markMeetingAttendanceLogNotifiedById = async (
  id: string | ObjectId,
): Promise<MeetingAttendanceLogDocument | null> => {
  const collection = getMeetingAttendanceLogsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "meetingAttendanceLogId"),
    },
    {
      $set: {
        notificationSent: true,
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const markMeetingAttendanceLogsNotified = async (
  ids: Array<string | ObjectId>,
): Promise<number> => {
  const collection = getMeetingAttendanceLogsCollection();
  const uniqueIds = Array.from(
    new Set(
      ids.map((id) => toObjectId(id, "meetingAttendanceLogId").toHexString()),
    ),
  ).map((value) => new ObjectId(value));

  if (uniqueIds.length === 0) {
    return 0;
  }

  const result = await collection.updateMany(
    {
      _id: { $in: uniqueIds },
      notificationSent: false,
    },
    {
      $set: {
        notificationSent: true,
        ...touchTimestamps(),
      },
    },
  );

  return result.modifiedCount;
};

export const assertLogStatus = (status: AttendanceLogStatus): void => {
  assertAttendanceLogStatus(status);
};

export { toObjectId };
