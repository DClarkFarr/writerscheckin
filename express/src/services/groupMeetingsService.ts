import {
  createGroupMeeting,
  CreateGroupMeetingInput,
  getLatestUpcomingMeetingByGroupId,
  type GroupMeetingDocument,
} from "../models/groupMeetings";
import { getGroupById, GroupDocument } from "../models/groups";
import {
  listGroupMembersByGroupId,
  type GroupMemberDocument,
} from "../models/groupMembers";
import { ensureDate, ensureObjectId } from "../models/types";
import { AuthError } from "./authService";
import { listMeetingAttendeesByMeetingId } from "../models/meetingAttendees";
import { getUserById } from "../models/users";
import type { AttendanceStatus } from "../models/groupModelCommon";
import { getCollection } from "../models/collections";
import { ObjectId } from "mongodb";
import { DecodedCursor } from "../utils/pagination";
import { groupMemberDocumentToResponse } from "./groupMembersService";

export type MyMeetingsSegment = "upcoming" | "past";
export type UserMeetingCheckinState =
  | "attending"
  | "reading"
  | "not_attending"
  | "none";
export type MeetingDisplayTone = "blue" | "red" | "gray";

// ====== Meeting Detail & Edit DTO Types ======

export interface MeetingParticipantRow {
  memberId: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member";
  membershipStatus:
    | "accepted"
    | "invited"
    | "declined"
    | "cancelled"
    | "removed";
  attendanceState: "attending" | "reading" | "not_attending" | "none";
  isCurrentUser: boolean;
}

export interface MeetingDetailResponse {
  meetingId: string;
  groupId: string;
  groupName: string;
  name: string;
  occursAt: string;
  address: string;
  description: string;
  startTime: { hours: number; minutes: number };
  durationMinutes: number;
  status: "draft" | "published";
  userCheckinState: UserMeetingCheckinState;
  canCheckin: boolean;
  canEdit: boolean;
  attendingCount: number;
  readingCount: number;
  participantRows: MeetingParticipantRow[];
}

export interface EditableMeetingResponse {
  meetingId: string;
  groupId: string;
  name: string;
  occursAt: string;
  description: string;
  address: string;
  startTime: { hours: number; minutes: number };
  durationMinutes: number;
  publishEmailMessage: string;
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: "draft" | "published";
  publishScheduledFor: string | null;
  canPublishNow: boolean;
  savedAt: string | null;
}

export interface MeetingAutosaveResult {
  meetingId: string;
  savedAt: string;
  status: "draft" | "published";
  publishScheduledFor: string | null;
  updatedFields: string[];
}

export interface PublishMeetingResult {
  meetingId: string;
  status: "published";
  publishedAt: string;
  attendanceEnabled: true;
}

export interface MyMeetingFeedItem extends Omit<
  CreateGroupMeetingInput,
  | "emailMessage"
  | "publishEmailMessage"
  | "attendanceEmailMessage"
  | "notifyAttendanceHoursBefore"
  | "publishHoursBefore"
  | "occursAt"
> {
  meetingId: string;
  occursAt: string;
  segment: MyMeetingsSegment;
  isAdminOnly: boolean;
  showAdminOnlyBadge: boolean;
  attendingCount: number;
  readingCount: number;
  userCheckinState: UserMeetingCheckinState;
  canCheckin: boolean;
}

export interface CreateUpcomingMeetingFromDefaultsInput {
  groupId: string;
  userId: string;
}

export interface CreateUpcomingMeetingFromDefaultsResult {
  groupId: string;
  meetingId: string;
  redirectTo: string;
  createdFromDefaults: true;
}

const computeNextOccurrence = (input: {
  daysOfWeek: number[];
  recurrenceFrequency: "weekly" | "biweekly";
  startTime: { hours: number; minutes: number };
  referenceDate: Date;
}): Date => {
  const base = new Date(input.referenceDate);
  base.setSeconds(0, 0);

  const days =
    input.daysOfWeek.length > 0
      ? Array.from(new Set(input.daysOfWeek))
      : [base.getDay()];
  const anchorDay = new Date(base);
  anchorDay.setHours(0, 0, 0, 0);

  const isAllowedByFrequency = (candidateDate: Date): boolean => {
    if (input.recurrenceFrequency === "weekly") {
      return true;
    }

    const candidateDay = new Date(candidateDate);
    candidateDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (candidateDay.getTime() - anchorDay.getTime()) / (1000 * 60 * 60 * 24),
    );
    const diffWeeks = Math.floor(diffDays / 7);
    return diffWeeks % 2 === 0;
  };

  for (let dayOffset = 0; dayOffset < 56; dayOffset += 1) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + dayOffset);

    if (!days.includes(candidate.getDay())) {
      continue;
    }

    if (!isAllowedByFrequency(candidate)) {
      continue;
    }

    candidate.setHours(input.startTime.hours, input.startTime.minutes, 0, 0);
    if (candidate.getTime() > input.referenceDate.getTime()) {
      return candidate;
    }
  }

  const fallback = new Date(base);
  fallback.setDate(
    base.getDate() + (input.recurrenceFrequency === "biweekly" ? 14 : 7),
  );
  fallback.setHours(input.startTime.hours, input.startTime.minutes, 0, 0);
  return fallback;
};

export const mapMeetingToMyMeetingFeedItem = (input: {
  meeting: GroupMeetingDocument;
  group: GroupDocument;
  segment: MyMeetingsSegment;
  isAdminOnly: boolean;
  attendingCount: number;
  readingCount: number;
  userCheckinState: UserMeetingCheckinState;
}): MyMeetingFeedItem => {
  const occursAt = input.meeting.occursAt ?? input.meeting.createdAt;
  const canCheckin = input.segment === "upcoming";
  const isDraft = input.meeting.status === "draft";

  return {
    meetingId: input.meeting._id.toHexString(),
    groupId: input.meeting.groupId.toHexString(),
    startTime: input.meeting.startTime,
    address: input.meeting.address,
    description: input.meeting.description,
    durationMinutes: input.meeting.durationMinutes,
    name: input.meeting.name,
    occursAt: occursAt.toISOString(),
    segment: input.segment,
    status: input.meeting.status,
    isAdminOnly: input.isAdminOnly,
    showAdminOnlyBadge: isDraft && input.isAdminOnly,
    attendingCount: input.attendingCount,
    readingCount: input.readingCount,
    userCheckinState: input.userCheckinState,
    canCheckin,
  };
};

export const createNextUpcomingMeetingFromGroupDefaults = async (
  groupId: string,
): Promise<{ groupId: string; meetingId: string }> => {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  const latestUpcoming = await getLatestUpcomingMeetingByGroupId(group._id);
  const referenceDate = latestUpcoming
    ? (latestUpcoming.occursAt ?? latestUpcoming.createdAt)
    : new Date();

  const occursAt = computeNextOccurrence({
    daysOfWeek: group.recurrenceRule.daysOfWeek,
    recurrenceFrequency: group.recurrenceRule.frequency,
    startTime: group.startTime,
    referenceDate,
  });

  const meeting = await createGroupMeeting({
    groupId: group._id,
    name: group.name,
    occursAt,
    description: group.description,
    emailMessage: group.publishEmailMessage,
    address: group.address,
    startTime: group.startTime,
    durationMinutes: group.durationMinutes,
    publishEmailMessage: group.publishEmailMessage,
    attendanceEmailMessage: group.attendanceEmailMessage,
    publishHoursBefore: group.publishHoursBefore,
    notifyAttendanceHoursBefore: group.notifyAttendanceHoursBefore,
    status: "draft",
  });

  return {
    groupId: group._id.toHexString(),
    meetingId: meeting._id.toHexString(),
  };
};

const assertCanManageGroupMeeting = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  const group = await getGroupById(groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  const userObjectId = ensureObjectId(userId, "userId");
  const memberships = await listGroupMembersByGroupId(groupId, { limit: 500 });
  const managerMembership = memberships.find(
    (member) =>
      member.userId?.equals(userObjectId) &&
      (member.role === "owner" ||
        (member.role === "admin" && member.status === "accepted")),
  );

  if (!managerMembership) {
    throw new AuthError("Forbidden", 403);
  }
};

export const createUpcomingMeetingFromDefaults = async (
  input: CreateUpcomingMeetingFromDefaultsInput,
): Promise<CreateUpcomingMeetingFromDefaultsResult> => {
  await assertCanManageGroupMeeting(input.groupId, input.userId);
  const { groupId, meetingId } =
    await createNextUpcomingMeetingFromGroupDefaults(input.groupId);

  return {
    groupId,
    meetingId,
    redirectTo: `/groups/${groupId}/meetings/${meetingId}/edit`,
    createdFromDefaults: true,
  };
};

// ====== Meeting Detail & Edit Helpers ======

const computePublishScheduledFor = (
  publishHoursBefore: number,
  occursAt: Date,
): Date => {
  const result = new Date(occursAt);
  result.setHours(result.getHours() - publishHoursBefore);
  return result;
};

const buildMeetingParticipantRows = async (
  members: GroupMemberDocument[],
  attendeeStatuses: Map<string, AttendanceStatus>,
  currentUserId: string,
): Promise<MeetingParticipantRow[]> => {
  const rows: MeetingParticipantRow[] = [];

  for (const member of members) {
    const memberIdHex = member._id.toHexString();
    const status = attendeeStatuses.get(memberIdHex) ?? "none";

    const attendanceState: "attending" | "reading" | "not_attending" | "none" =
      status === "invited" ? "none" : (status as any);

    const isCurrentUser = member.userId
      ? member.userId.equals(ensureObjectId(currentUserId, "currentUserId"))
      : false;

    // Get user details if linked
    let displayName = "Unknown Member";
    let avatarUrl: string | null = null;
    if (member.userId) {
      const user = await getUserById(member.userId);
      if (user) {
        displayName = `${user.firstName} ${user.lastName}`.trim();
      }
    }

    rows.push({
      memberId: memberIdHex,
      userId: member.userId?.toHexString() ?? null,
      displayName,
      avatarUrl,
      role: member.role,
      membershipStatus: member.status,
      attendanceState,
      isCurrentUser,
    });
  }

  return rows;
};

export const buildMeetingDetailResponse = async (
  meeting: GroupMeetingDocument,
  group: GroupDocument,
  currentUserId: string,
): Promise<MeetingDetailResponse> => {
  // Authorization: user must be accepted member
  const members = await listGroupMembersByGroupId(
    meeting.groupId.toHexString(),
    {
      limit: 500,
    },
  );
  const userObjectId = ensureObjectId(currentUserId, "userId");
  const userMembership = members.find(
    (m) => m.userId?.equals(userObjectId) && m.status === "accepted",
  );

  if (!userMembership) {
    throw new AuthError("Forbidden", 403);
  }

  // If draft, only admins and owners can view
  if (
    meeting.status === "draft" &&
    userMembership.role !== "admin" &&
    userMembership.role !== "owner"
  ) {
    throw new AuthError("Forbidden", 403);
  }

  // Get attendance status
  const attendees = await listMeetingAttendeesByMeetingId(meeting._id);
  const attendeeStatuses = new Map(
    attendees.map((a) => [a.memberId.toHexString(), a.status]),
  );

  // Count attendance
  let attendingCount = 0;
  let readingCount = 0;
  let userCheckinState: UserMeetingCheckinState = "none";

  for (const [memberId, status] of attendeeStatuses) {
    if (status === "attending") attendingCount++;
    if (status === "reading") readingCount++;
    if (memberId === userMembership._id.toHexString()) {
      userCheckinState =
        status === "invited" ? "none" : (status as UserMeetingCheckinState);
    }
  }

  // Build participant rows (accepted members only)
  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const participantRows = await buildMeetingParticipantRows(
    acceptedMembers,
    attendeeStatuses,
    currentUserId,
  );

  // Check if can check in (only for upcoming published meetings)
  const now = new Date();
  const isUpcoming = meeting.occursAt > now;
  const canCheckin = isUpcoming && meeting.status === "published";

  return {
    meetingId: meeting._id.toHexString(),
    groupId: meeting.groupId.toHexString(),
    groupName: group.name,
    name: meeting.name,
    occursAt: meeting.occursAt.toISOString(),
    address: meeting.address,
    description: meeting.description,
    startTime: meeting.startTime,
    durationMinutes: meeting.durationMinutes,
    status: meeting.status,
    userCheckinState,
    canCheckin,
    canEdit: userMembership.role === "owner" || userMembership.role === "admin",
    attendingCount,
    readingCount,
    participantRows,
  };
};

export const buildEditableMeetingResponse = async (
  meeting: GroupMeetingDocument,
  group: GroupDocument,
  currentUserId: string,
): Promise<EditableMeetingResponse> => {
  // Authorization: user must be accepted admin or owner
  const members = await listGroupMembersByGroupId(
    meeting.groupId.toHexString(),
    {
      limit: 500,
    },
  );
  const userObjectId = ensureObjectId(currentUserId, "userId");
  const adminMembership = members.find(
    (m) =>
      m.userId?.equals(userObjectId) &&
      m.status === "accepted" &&
      (m.role === "owner" || m.role === "admin"),
  );

  if (!adminMembership) {
    throw new AuthError("Forbidden", 403);
  }

  const publishScheduledFor = computePublishScheduledFor(
    meeting.publishHoursBefore,
    meeting.occursAt,
  );

  return {
    meetingId: meeting._id.toHexString(),
    groupId: meeting.groupId.toHexString(),
    name: meeting.name,
    occursAt: meeting.occursAt.toISOString(),
    description: meeting.description,
    address: meeting.address,
    startTime: meeting.startTime,
    durationMinutes: meeting.durationMinutes,
    publishEmailMessage: meeting.publishEmailMessage,
    attendanceEmailMessage: meeting.attendanceEmailMessage,
    publishHoursBefore: meeting.publishHoursBefore,
    notifyAttendanceHoursBefore: meeting.notifyAttendanceHoursBefore,
    status: meeting.status,
    publishScheduledFor: publishScheduledFor.toISOString(),
    canPublishNow: meeting.status === "draft",
    savedAt: null,
  };
};

export const groupMeetingDocumentToResponse = (doc: GroupMeetingDocument) => {
  return {
    meetingId: doc._id.toHexString(),
    groupId: doc.groupId.toHexString(),
    name: doc.name,
    occursAt: doc.occursAt.toISOString(),
    description: doc.description,
    address: doc.address,
    startTime: doc.startTime,
    durationMinutes: doc.durationMinutes,
    publishEmailMessage: doc.publishEmailMessage,
    attendanceEmailMessage: doc.attendanceEmailMessage,
    publishHoursBefore: doc.publishHoursBefore,
    notifyAttendanceHoursBefore: doc.notifyAttendanceHoursBefore,
    status: doc.status,
  };
};

export type AggregationMemberNextUpcomingMeetingInput = {
  userId: string | ObjectId;
};

export type MemberMeetingAggregationItem = GroupMeetingDocument & {
  membership: GroupMemberDocument;
};
export const getAggregationMemberNextUpcomingMeetings = async ({
  userId,
}: AggregationMemberNextUpcomingMeetingInput) => {
  const groupMembersCollection = getCollection("groupMembers");

  const rows = await groupMembersCollection
    .aggregate<MemberMeetingAggregationItem>([
      ...GroupMeetingAggregation.userActiveMemberships(userId),
      ...GroupMeetingAggregation.membershipsToMeetingLookup(),
      ...GroupMeetingAggregation.matchUpcomingMeeting(new Date()),
      ...GroupMeetingAggregation.matchPublishedOrAdminMeeting(),
      ...GroupMeetingAggregation.sortMeetingsByOccursAt(1),
      ...GroupMeetingAggregation.takeFirstOfEachGroup(),
      ...GroupMeetingAggregation.sortMeetingsByOccursAt(-1),
    ])
    .toArray();

  return rows;
};

export type AggregationMemberMeetingsPaginatedInput = {
  userId: string | ObjectId;
  cursor: DecodedCursor | null;
  limit: number | undefined;
};
export const getAggregationMemberMeetingsPaginated = async ({
  userId,
  cursor,
  limit = 20,
}: AggregationMemberMeetingsPaginatedInput) => {
  const groupMembersCollection = getCollection("groupMembers");

  const rows = await groupMembersCollection
    .aggregate<MemberMeetingAggregationItem>([
      ...GroupMeetingAggregation.userActiveMemberships(userId),
      ...GroupMeetingAggregation.membershipsToMeetingLookup(),
      ...GroupMeetingAggregation.matchPublishedOrAdminMeeting(),
      ...GroupMeetingAggregation.matchAfterCursor(cursor),
      ...GroupMeetingAggregation.sortMeetingsByOccursAt(-1),
      ...GroupMeetingAggregation.takeByLimit(limit),
    ])
    .toArray();

  return rows;
};

export const memberMeetingAggregationRowToResponse = (
  row: MemberMeetingAggregationItem,
) => {
  return {
    ...groupMeetingDocumentToResponse(row),
    membership: groupMemberDocumentToResponse(row.membership),
  };
};

export const GroupMeetingAggregation = {
  userActiveMemberships: (userId: string | ObjectId) => {
    return [
      {
        $match: {
          $and: [
            {
              userId: ensureObjectId(userId, "userId"),
            },
            {
              $or: [
                {
                  role: "owner",
                },
                {
                  status: "accepted",
                },
              ],
            },
          ],
        },
      },
    ];
  },
  membershipsToMeetingLookup: () => {
    return [
      {
        $lookup: {
          from: "groupMeetings",
          localField: "groupId",
          foreignField: "groupId",
          as: "meeting",
        },
      },
      {
        $unwind: {
          path: "$meeting",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$meeting",
              {
                membership: {
                  $unsetField: {
                    field: "meeting",
                    input: "$$ROOT",
                  },
                },
              },
            ],
          },
        },
      },
    ];
  },
  matchUpcomingMeeting: (date: Date | string) => {
    return [
      {
        occursAt: {
          $gte: ensureDate(date, "date"),
        },
      },
    ];
  },
  matchPastMeeting: (date: Date | string) => {
    return [
      {
        occursAt: {
          $lte: ensureDate(date, "date"),
        },
      },
    ];
  },
  matchPublishedOrAdminMeeting: () => {
    return [
      {
        $match: {
          $or: [
            {
              "membership.role": {
                $in: ["admin", "owner"],
              },
            },
            {
              "membership.role": "member",
              status: {
                $ne: "draft",
              },
            },
          ],
        },
      },
    ];
  },
  sortMeetingsByOccursAt: (sort: 1 | -1) => {
    return [
      {
        $sort: {
          occursAt: sort,
        },
      },
    ];
  },
  takeFirstOfEachGroup: () => {
    return [
      {
        $group: {
          _id: {
            groupId: "$groupId",
          },
          row: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$row",
        },
      },
    ];
  },
  matchAfterCursor: (cursor: DecodedCursor | null | undefined) => {
    if (!cursor) {
      return [];
    }

    return [
      {
        $match: {
          $or: [
            {
              date: {
                $lt: cursor.date,
              },
            },
            {
              date: cursor.date,
              _id: {
                $lt: ensureObjectId(cursor.id, "cursor.id"),
              },
            },
          ],
        },
      },
    ];
  },
  takeByLimit: (limit: number) => {
    return [
      {
        $limit: limit,
      },
    ];
  },
};
