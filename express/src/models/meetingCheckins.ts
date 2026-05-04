import { ObjectId } from "mongodb";
import {
  createMeetingAttendee,
  getMeetingAttendeeByMember,
  getMeetingAttendeesCollection,
  type AttendanceLogContext,
  type MeetingAttendeeDocument,
  updateMeetingAttendeeStatusById,
} from "./meetingAttendees";
import { toObjectId } from "./groupModelCommon";

export type MeetingCheckinState = "attending" | "reading" | "not_attending";

const toAttendanceStatus = (
  state: MeetingCheckinState,
): "attending" | "reading" | "skipping" => {
  if (state === "not_attending") {
    return "skipping";
  }

  return state;
};

const toCheckinState = (
  status: MeetingAttendeeDocument["status"],
): MeetingCheckinState | null => {
  if (status === "attending") {
    return "attending";
  }
  if (status === "reading") {
    return "reading";
  }
  if (status === "skipping") {
    return "not_attending";
  }

  return null;
};

export interface MeetingCheckinAggregate {
  attendingCount: number;
  readingCount: number;
}

export const setMeetingCheckinState = async (input: {
  meetingId: string | ObjectId;
  memberId: string | ObjectId;
  state: MeetingCheckinState;
  logContext?: AttendanceLogContext;
}): Promise<MeetingAttendeeDocument> => {
  const meetingId = toObjectId(input.meetingId, "meetingId");
  const memberId = toObjectId(input.memberId, "memberId");
  const nextStatus = toAttendanceStatus(input.state);

  const existing = await getMeetingAttendeeByMember(meetingId, memberId);
  if (!existing) {
    return createMeetingAttendee({
      meetingId,
      memberId,
      status: nextStatus,
    });
  }

  const updated = await updateMeetingAttendeeStatusById(
    existing._id,
    nextStatus,
    input.logContext,
  );

  if (!updated) {
    throw new Error("Unable to update check-in status.");
  }

  return updated;
};

export const getUserCheckinStatesForMeetings = async (input: {
  memberId: string | ObjectId;
  meetingIds: Array<string | ObjectId>;
}): Promise<Map<string, MeetingCheckinState>> => {
  if (!input.meetingIds.length) {
    return new Map();
  }

  const collection = getMeetingAttendeesCollection();
  const memberId = toObjectId(input.memberId, "memberId");
  const meetingIds = input.meetingIds.map((id) => toObjectId(id, "meetingId"));

  const rows = await collection
    .find({
      memberId,
      meetingId: { $in: meetingIds },
      status: { $in: ["attending", "reading", "skipping"] },
    })
    .project({ meetingId: 1, status: 1 })
    .toArray();

  const map = new Map<string, MeetingCheckinState>();
  for (const row of rows) {
    const mapped = toCheckinState(row.status);
    if (mapped) {
      map.set(row.meetingId.toHexString(), mapped);
    }
  }

  return map;
};

export const getUserCheckinStatesForMeetingsByMemberIds = async (input: {
  memberIds: Array<string | ObjectId>;
  meetingIds: Array<string | ObjectId>;
}): Promise<Map<string, MeetingCheckinState>> => {
  if (!input.memberIds.length || !input.meetingIds.length) {
    return new Map();
  }

  const collection = getMeetingAttendeesCollection();
  const memberIds = input.memberIds.map((id) => toObjectId(id, "memberId"));
  const meetingIds = input.meetingIds.map((id) => toObjectId(id, "meetingId"));

  const rows = await collection
    .find({
      memberId: { $in: memberIds },
      meetingId: { $in: meetingIds },
      status: { $in: ["attending", "reading", "skipping"] },
    })
    .project({ meetingId: 1, status: 1 })
    .toArray();

  const map = new Map<string, MeetingCheckinState>();
  for (const row of rows) {
    const mapped = toCheckinState(row.status);
    if (mapped) {
      map.set(row.meetingId.toHexString(), mapped);
    }
  }

  return map;
};

export const getMeetingCheckinAggregate = async (
  meetingId: string | ObjectId,
): Promise<MeetingCheckinAggregate> => {
  const collection = getMeetingAttendeesCollection();
  const id = toObjectId(meetingId, "meetingId");

  const [result] = await collection
    .aggregate<MeetingCheckinAggregate>([
      { $match: { meetingId: id, status: { $in: ["attending", "reading"] } } },
      {
        $group: {
          _id: "$meetingId",
          attendingCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["attending", "reading"]] }, 1, 0],
            },
          },
          readingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "reading"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          attendingCount: 1,
          readingCount: 1,
        },
      },
    ])
    .toArray();

  return {
    attendingCount: result?.attendingCount ?? 0,
    readingCount: result?.readingCount ?? 0,
  };
};

export const getMeetingCheckinAggregatesByMeetingIds = async (
  meetingIds: Array<string | ObjectId>,
): Promise<Map<string, MeetingCheckinAggregate>> => {
  if (!meetingIds.length) {
    return new Map();
  }

  const collection = getMeetingAttendeesCollection();
  const objectIds = meetingIds.map((id) => toObjectId(id, "meetingId"));

  const rows = await collection
    .aggregate<{
      meetingId: ObjectId;
      attendingCount: number;
      readingCount: number;
    }>([
      {
        $match: {
          meetingId: { $in: objectIds },
          status: { $in: ["attending", "reading"] },
        },
      },
      {
        $group: {
          _id: "$meetingId",
          attendingCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["attending", "reading"]] }, 1, 0],
            },
          },
          readingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "reading"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          meetingId: "$_id",
          attendingCount: 1,
          readingCount: 1,
        },
      },
    ])
    .toArray();

  const map = new Map<string, MeetingCheckinAggregate>();
  for (const row of rows) {
    map.set(row.meetingId.toHexString(), {
      attendingCount: row.attendingCount,
      readingCount: row.readingCount,
    });
  }

  return map;
};
