import { Collection, ObjectId, type Document } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  AttendanceStatus,
  assertAttendanceStatus,
  toObjectId,
} from "./groupModelCommon";
import { createMeetingAttendanceLog } from "./meetingAttendanceLogs";
import {
  BaseModelBlueprint,
  createTimestamps,
  ModelBlueprint,
  ModelDocument,
  ModelInsertInput,
  touchTimestamps,
} from "./types";

export interface MeetingAttendeeDefinition extends BaseModelBlueprint {
  meetingId: ObjectId;
  memberId: ObjectId;
  status: AttendanceStatus;
}

export type MeetingAttendeeBlueprint =
  ModelBlueprint<MeetingAttendeeDefinition>;
export type MeetingAttendeeDocument = ModelDocument<MeetingAttendeeDefinition>;

export interface CreateMeetingAttendeeInput {
  meetingId: string | ObjectId;
  memberId: string | ObjectId;
  status?: AttendanceStatus;
}

export interface AttendanceLogContext {
  groupId: string | ObjectId;
  userId: string | ObjectId;
}

export const getMeetingAttendeesCollection =
  (): Collection<MeetingAttendeeDocument> =>
    getCollection<MeetingAttendeeDocument>(COLLECTIONS.meetingAttendees);

export const ensureMeetingAttendeeIndexes = async (): Promise<void> => {
  const collection = getMeetingAttendeesCollection();
  await collection.createIndex({ meetingId: 1, memberId: 1 }, { unique: true });
};

export const createMeetingAttendee = async (
  input: CreateMeetingAttendeeInput,
): Promise<MeetingAttendeeDocument> => {
  const collection = getMeetingAttendeesCollection();
  const status = assertAttendanceStatus(input.status ?? "invited");

  const payload: ModelInsertInput<MeetingAttendeeDefinition> = {
    meetingId: toObjectId(input.meetingId, "meetingId"),
    memberId: toObjectId(input.memberId, "memberId"),
    status,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as MeetingAttendeeDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const getMeetingAttendeeById = async (
  id: string | ObjectId,
): Promise<MeetingAttendeeDocument | null> => {
  const collection = getMeetingAttendeesCollection();
  return collection.findOne({ _id: toObjectId(id, "meetingAttendeeId") });
};

export const getMeetingAttendeeByMember = async (
  meetingId: string | ObjectId,
  memberId: string | ObjectId,
): Promise<MeetingAttendeeDocument | null> => {
  const collection = getMeetingAttendeesCollection();
  return collection.findOne({
    meetingId: toObjectId(meetingId, "meetingId"),
    memberId: toObjectId(memberId, "memberId"),
  });
};

export const listMeetingAttendeesByMeetingId = async (
  meetingId: string | ObjectId,
): Promise<MeetingAttendeeDocument[]> => {
  const collection = getMeetingAttendeesCollection();
  return collection
    .find({ meetingId: toObjectId(meetingId, "meetingId") })
    .sort({ createdAt: 1 })
    .toArray();
};

export const buildCurrentMemberMeetingAttendanceLookup = (
  input: {
    attendanceField?: string;
    meetingIdField?: string;
    memberIdField?: string;
    preserveNullAndEmptyArrays?: boolean;
  } = {},
): Document[] => {
  const attendanceField = input.attendanceField ?? "attendance";
  const meetingIdField = input.meetingIdField ?? "_id";
  const memberIdField = input.memberIdField ?? "membership._id";

  return [
    {
      $lookup: {
        from: COLLECTIONS.meetingAttendees,
        let: {
          meetingId: `$${meetingIdField}`,
          memberId: `$${memberIdField}`,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$meetingId", "$$meetingId"] },
                  { $eq: ["$memberId", "$$memberId"] },
                ],
              },
            },
          },
          {
            $limit: 1,
          },
        ],
        as: attendanceField,
      },
    },
    {
      $unwind: {
        path: `$${attendanceField}`,
        preserveNullAndEmptyArrays: input.preserveNullAndEmptyArrays ?? true,
      },
    },
  ];
};

export const meetingAttendeeDocumentToResponse = (
  doc: MeetingAttendeeDocument,
) => {
  const createdAt = doc.createdAt.toISOString();

  return {
    meetingAttendeeId: doc._id.toHexString(),
    meetingId: doc.meetingId.toHexString(),
    memberId: doc.memberId.toHexString(),
    status: doc.status,
    createdAt,
    updatedAt: doc.updatedAt?.toISOString() ?? createdAt,
  };
};

export const updateMeetingAttendeeStatusById = async (
  id: string | ObjectId,
  status: AttendanceStatus,
  logContext?: AttendanceLogContext,
): Promise<MeetingAttendeeDocument | null> => {
  const collection = getMeetingAttendeesCollection();
  const nextStatus = assertAttendanceStatus(status);

  const attendee = await getMeetingAttendeeById(id);

  if (!attendee) {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: attendee._id },
    {
      $set: {
        status: nextStatus,
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  if (
    result &&
    result.status !== "invited" &&
    logContext &&
    attendee.status !== result.status
  ) {
    await appendAttendanceLogForAttendeeChange(result, logContext);
  }

  return result;
};

export const appendAttendanceLogForAttendeeChange = async (
  attendee: MeetingAttendeeDocument,
  logContext: AttendanceLogContext,
): Promise<void> => {
  if (attendee.status === "invited") {
    return;
  }

  await createMeetingAttendanceLog({
    groupId: logContext.groupId,
    memberId: attendee.memberId,
    userId: logContext.userId,
    meetingId: attendee.meetingId,
    status: attendee.status,
  });
};

export { toObjectId };
