import {
  createGroupMeeting,
  CreateGroupMeetingInput,
  getGroupMeetingById,
  listDueDraftMeetingsByPublishWindow,
  publishGroupMeetingById as publishGroupMeetingDocumentById,
  getAggregationMemberMeetingsPaginated as getAggregationMemberMeetingsPaginatedModel,
  getAggregationMemberNextUpcomingMeetings as getAggregationMemberNextUpcomingMeetingsModel,
  getLatestUpcomingMeetingByGroupId,
  type DueDraftMeetingCandidateRow,
  type MemberMeetingAggregationBaseItem,
  type MemberMeetingAggregationItem,
  type GroupMeetingDocument,
} from "../models/groupMeetings";
import { getGroupById, GroupDocument } from "../models/groups";
import {
  listActivePublicationRecipientsByGroupId,
  listGroupMembersByGroupId,
  type GroupMemberDocument,
} from "../models/groupMembers";
import { ensureDate, ensureObjectId } from "../models/types";
import { AuthError, ValidationError } from "./authService";
import {
  createMeetingAttendeeIfMissing,
  listMeetingAttendeesByMeetingId,
  meetingAttendeeDocumentToResponse,
} from "../models/meetingAttendees";
import { getUserById } from "../models/users";
import type { AttendanceStatus } from "../models/groupModelCommon";
import { ObjectId } from "mongodb";
import { DecodedCursor } from "../utils/pagination";
import { groupMemberDocumentToResponse } from "./groupMembersService";
import type { MeetingAttendeeDocument } from "../models/meetingAttendees";
import { getMeetingCheckinAggregatesByMeetingIds } from "../models/meetingCheckins";
import { sendEmail } from "./emailService";
import { buildGroupMeetingPublishEmail } from "./emailTemplates/groupMeetingPublish";

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
  status: "draft" | "published" | "cancelled";
  cancelledAt?: string;
  userCheckinState: UserMeetingCheckinState;
  canCheckin: boolean;
  canEdit: boolean;
  canCancel: boolean;
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
  status: "draft" | "published" | "cancelled";
  cancelledAt: string | null;
  publishScheduledFor: string | null;
  canPublishNow: boolean;
  canCancel: boolean;
  savedAt: string | null;
}

export interface MeetingAutosaveResult {
  meetingId: string;
  savedAt: string;
  status: "draft" | "published" | "cancelled";
  publishScheduledFor: string | null;
  updatedFields: string[];
}

export interface PublishMeetingResult {
  meetingId: string;
  status: "published";
  publishedAt: string;
  attendanceEnabled: true;
}

export interface CancelMeetingResult {
  meetingId: string;
  status: "cancelled";
  cancelledAt: string;
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

export interface ListDueDraftMeetingsInput {
  now?: Date;
  windowMinutes?: number;
  limit?: number;
}

export interface ScheduledMeetingPublicationCandidate {
  meetingId: string;
  groupId: string;
  occursAt: string;
  publishHoursBefore: number;
  publishEmailMessage: string;
  status: "draft";
  publishAtComputed: string;
}

export type PublishMeetingFromScheduleReason =
  | "published"
  | "not_due"
  | "already_published"
  | "cancelled"
  | "skipped"
  | "error";

export interface PublishMeetingFromScheduleResult {
  meetingId: string;
  groupId: string;
  published: boolean;
  reason: PublishMeetingFromScheduleReason;
  publishedAt: string | null;
  recipientCount: number;
  attendeeCreatedCount: number;
  emailSentCount: number;
  errorMessage?: string;
}

export interface PublishDueMeetingsBatchResult {
  startedAt: string;
  finishedAt: string;
  candidateCount: number;
  publishedCount: number;
  skippedCount: number;
  errorCount: number;
  results: PublishMeetingFromScheduleResult[];
}

export interface PublishDueMeetingsBatchInput {
  now?: Date;
  windowMinutes?: number;
  limit?: number;
}

export interface PublishMeetingFromScheduleInput {
  candidate: ScheduledMeetingPublicationCandidate;
  now?: Date;
}

const dueDraftMeetingRowToCandidate = (
  row: DueDraftMeetingCandidateRow,
): ScheduledMeetingPublicationCandidate => {
  return {
    meetingId: row._id.toHexString(),
    groupId: row.groupId.toHexString(),
    occursAt: row.occursAt.toISOString(),
    publishHoursBefore: row.publishHoursBefore,
    publishEmailMessage: row.publishEmailMessage,
    status: "draft",
    publishAtComputed: row.publishAtComputed.toISOString(),
  };
};

export const listDueDraftMeetingsForPublicationWindow = async (
  input: ListDueDraftMeetingsInput = {},
): Promise<ScheduledMeetingPublicationCandidate[]> => {
  const rows = await listDueDraftMeetingsByPublishWindow(input);
  return rows.map(dueDraftMeetingRowToCandidate);
};

const resolvePublicationRecipientEmail = async (
  member: GroupMemberDocument,
): Promise<string | null> => {
  if (member.userId) {
    const user = await getUserById(member.userId);
    if (user?.email) {
      return user.email;
    }
  }

  return member.email ?? null;
};

export const publishMeetingFromSchedule = async (
  input: PublishMeetingFromScheduleInput,
): Promise<PublishMeetingFromScheduleResult> => {
  const now = input.now ?? new Date();
  const { candidate } = input;

  const meeting = await getGroupMeetingById(candidate.meetingId);
  if (!meeting) {
    return {
      meetingId: candidate.meetingId,
      groupId: candidate.groupId,
      published: false,
      reason: "skipped",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
      errorMessage: "Meeting not found.",
    };
  }

  if (meeting.cancelledAt) {
    return {
      meetingId: meeting._id.toHexString(),
      groupId: meeting.groupId.toHexString(),
      published: false,
      reason: "cancelled",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
    };
  }

  if (meeting.status === "published") {
    return {
      meetingId: meeting._id.toHexString(),
      groupId: meeting.groupId.toHexString(),
      published: false,
      reason: "already_published",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
    };
  }

  if (meeting.status !== "draft") {
    return {
      meetingId: meeting._id.toHexString(),
      groupId: meeting.groupId.toHexString(),
      published: false,
      reason: "skipped",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
      errorMessage: `Unsupported status '${meeting.status}'.`,
    };
  }

  const publishAtComputed = computePublishScheduledFor(
    meeting.publishHoursBefore,
    meeting.occursAt,
  );
  if (publishAtComputed.getTime() > now.getTime()) {
    return {
      meetingId: meeting._id.toHexString(),
      groupId: meeting.groupId.toHexString(),
      published: false,
      reason: "not_due",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
    };
  }

  try {
    const publishedMeeting = await publishGroupMeetingDocumentById(meeting._id);
    if (!publishedMeeting) {
      return {
        meetingId: meeting._id.toHexString(),
        groupId: meeting.groupId.toHexString(),
        published: false,
        reason: "error",
        publishedAt: null,
        recipientCount: 0,
        attendeeCreatedCount: 0,
        emailSentCount: 0,
        errorMessage: "Failed to persist published status.",
      };
    }

    const recipients = await listActivePublicationRecipientsByGroupId(
      meeting.groupId,
      {
        limit: 500,
      },
    );

    let attendeeCreatedCount = 0;
    let emailSentCount = 0;

    for (const recipient of recipients) {
      const attendeeResult = await createMeetingAttendeeIfMissing({
        meetingId: meeting._id,
        memberId: recipient._id,
        status: "invited",
      });

      if (attendeeResult.created) {
        attendeeCreatedCount += 1;
      }

      const recipientEmail = await resolvePublicationRecipientEmail(recipient);
      if (!recipientEmail) {
        continue;
      }

      const email = buildGroupMeetingPublishEmail({
        meetingName: meeting.name,
        occursAt: meeting.occursAt,
        publishMessage: meeting.publishEmailMessage,
      });

      await sendEmail({
        to: recipientEmail,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      emailSentCount += 1;
    }

    return {
      meetingId: publishedMeeting._id.toHexString(),
      groupId: publishedMeeting.groupId.toHexString(),
      published: true,
      reason: "published",
      publishedAt:
        publishedMeeting.updatedAt?.toISOString() ?? now.toISOString(),
      recipientCount: recipients.length,
      attendeeCreatedCount,
      emailSentCount,
    };
  } catch (error) {
    return {
      meetingId: meeting._id.toHexString(),
      groupId: meeting.groupId.toHexString(),
      published: false,
      reason: "error",
      publishedAt: null,
      recipientCount: 0,
      attendeeCreatedCount: 0,
      emailSentCount: 0,
      errorMessage:
        error instanceof Error ? error.message : "Unknown publish error.",
    };
  }
};

export const publishDueMeetingsBatch = async (
  input: PublishDueMeetingsBatchInput = {},
): Promise<PublishDueMeetingsBatchResult> => {
  const startedAt = new Date();
  const now = input.now ?? new Date();

  const candidates = await listDueDraftMeetingsForPublicationWindow({
    now,
    ...(typeof input.windowMinutes === "number"
      ? { windowMinutes: input.windowMinutes }
      : {}),
    ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
  });

  const results: PublishMeetingFromScheduleResult[] = [];
  for (const candidate of candidates) {
    const result = await publishMeetingFromSchedule({ candidate, now });
    results.push(result);
  }

  const publishedCount = results.filter(
    (row) => row.reason === "published",
  ).length;
  const errorCount = results.filter((row) => row.reason === "error").length;
  const skippedCount = results.length - publishedCount - errorCount;

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    publishedCount,
    skippedCount,
    errorCount,
    results,
  };
};

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

  // If canceled, only admins and owners can view
  if (
    !!meeting.cancelledAt &&
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

  // Check if can check in (only for upcoming published meetings, not canceled)
  const now = new Date();
  const isUpcoming = meeting.occursAt > now;
  const canCheckin = isUpcoming && meeting.status === "published";
  const canEdit =
    (userMembership.role === "owner" || userMembership.role === "admin") &&
    !!meeting.cancelledAt === false;
  const canCancel =
    isUpcoming &&
    (userMembership.role === "owner" || userMembership.role === "admin") &&
    meeting.status === "published";

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
    ...(meeting.cancelledAt && {
      cancelledAt: meeting.cancelledAt.toISOString(),
    }),
    userCheckinState,
    canCheckin,
    canEdit,
    canCancel,
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

  const now = new Date();
  const isUpcoming = meeting.occursAt > now;
  const canCancel =
    isUpcoming && meeting.status === "published" && !meeting.cancelledAt;

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
    cancelledAt: meeting.cancelledAt?.toISOString() ?? null,
    publishScheduledFor: publishScheduledFor.toISOString(),
    canPublishNow: meeting.status === "draft",
    canCancel,
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
    cancelledAt: doc.cancelledAt?.toISOString() ?? null,
  };
};

export type MemberMeetingCounts = {
  attending: number;
  reading: number;
};

export type MemberMeetingAttendanceResponse = {
  meetingAttendeeId: string;
  meetingId: string;
  memberId: string;
  status: MeetingAttendeeDocument["status"];
  createdAt: string;
  updatedAt: string;
};

export type MemberMeetingAggregationEnrichment = {
  attendance: MeetingAttendeeDocument | null;
  counts: MemberMeetingCounts;
};

export type EnrichedMemberMeetingAggregationItem =
  MemberMeetingAggregationItem & MemberMeetingAggregationEnrichment;

const toMemberMeetingCounts = (input?: {
  attendingCount: number;
  readingCount: number;
}): MemberMeetingCounts => {
  return {
    attending: input?.attendingCount ?? 0,
    reading: input?.readingCount ?? 0,
  };
};

export const populateMeetingsWithCounts = async (
  rows: MemberMeetingAggregationItem[],
): Promise<EnrichedMemberMeetingAggregationItem[]> => {
  if (!rows.length) {
    return [];
  }

  const meetingIds = rows.map((row) => row._id);
  const countsByMeetingId =
    await getMeetingCheckinAggregatesByMeetingIds(meetingIds);

  return rows.map((row) => ({
    ...row,
    counts: toMemberMeetingCounts(countsByMeetingId.get(row._id.toHexString())),
  }));
};

export type AggregationMemberNextUpcomingMeetingInput = {
  userId: string | ObjectId;
};

export const getAggregationMemberNextUpcomingMeetings = async ({
  userId,
}: AggregationMemberNextUpcomingMeetingInput): Promise<
  MemberMeetingAggregationBaseItem[]
> => {
  return getAggregationMemberNextUpcomingMeetingsModel({ userId });
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
}: AggregationMemberMeetingsPaginatedInput): Promise<
  EnrichedMemberMeetingAggregationItem[]
> => {
  const rows = await getAggregationMemberMeetingsPaginatedModel({
    userId,
    cursor,
    limit,
  });

  return populateMeetingsWithCounts(rows);
};

export const memberMeetingAggregationRowToResponse = (
  row: EnrichedMemberMeetingAggregationItem,
) => {
  return {
    ...groupMeetingDocumentToResponse(row),
    membership: groupMemberDocumentToResponse(row.membership),
    attendance: row.attendance
      ? meetingAttendeeDocumentToResponse(row.attendance)
      : null,
    counts: row.counts,
  };
};
