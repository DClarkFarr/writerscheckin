import {
  decodeCursor,
  normalizePageSize,
  type DecodedCursor,
} from "./groupsPagination";
import {
  mapToGroupSummaryItem,
  type GroupSummaryItem,
} from "./groupSummaryMapper";
import {
  createGroup,
  getGroupById,
  listGroups,
  updateGroupById,
} from "../models/groups";
import {
  listGroupMembersByGroupId,
  saveGroupMember,
  softDeleteGroupMemberByGroupAndUserId,
} from "../models/groupMembers";
import { listGroupMeetingsByGroupId } from "../models/groupMeetings";
import { ensureObjectId } from "../models/types";
import { listUsers, listUsersByIds } from "../models/users";
import {
  assertTimeOfDay,
  type GroupMemberInviteStatus,
  type GroupMemberRole,
  type MeetingTimeOfDay,
} from "../models/groupModelCommon";
import { AuthError } from "./authService";

export interface ListMyGroupsInput {
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface ListMyGroupsResult {
  items: GroupSummaryItem[];
  nextCursor: string | null;
  pageSize: number;
  decodedCursor: DecodedCursor | null;
}

export interface SearchGroupParticipantsInput {
  query?: string;
  excludeUserId?: string;
  limit?: number;
}

export interface SearchGroupParticipantsResultItem {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface GroupFormParticipant extends SearchGroupParticipantsResultItem {}

export interface GroupFormPayload {
  name: string;
  description?: string;
  address?: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: "weekly" | "biweekly";
  recurrenceDaysOfWeek: number[];
  publicMessage?: string;
  attendanceMessage?: string;
  adminUserIds: string[];
  memberUserIds: string[];
}

export interface EditableGroupFormResult {
  groupId: string;
  isActive: boolean;
  name: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: "weekly" | "biweekly";
  recurrenceDaysOfWeek: number[];
  publicMessage: string;
  attendanceMessage: string;
  admins: GroupFormParticipant[];
  members: GroupFormParticipant[];
}

export interface SaveGroupResult {
  groupId: string;
  name: string;
  isActive: boolean;
}

const DEFAULT_PUBLISH_HOURS_BEFORE = 24;
const DEFAULT_ATTENDANCE_HOURS_BEFORE = 2;

const parseTimeString = (value: string): MeetingTimeOfDay => {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Invalid startTime.");
  }

  const [hoursText, minutesText] = value.split(":");
  if (hoursText === undefined || minutesText === undefined) {
    throw new Error("Invalid startTime.");
  }

  const timeOfDay = {
    hours: Number.parseInt(hoursText, 10),
    minutes: Number.parseInt(minutesText, 10),
  };

  assertTimeOfDay(timeOfDay);
  return timeOfDay;
};

const formatTimeString = (value: MeetingTimeOfDay): string =>
  `${value.hours.toString().padStart(2, "0")}:${value.minutes
    .toString()
    .padStart(2, "0")}`;

const normalizeUserIds = (values: string[], label: string): string[] =>
  Array.from(
    new Set(values.map((value) => ensureObjectId(value, label).toHexString())),
  );

const toParticipantSummary = (
  input: Awaited<ReturnType<typeof listUsersByIds>>[number],
): GroupFormParticipant => ({
  userId: input._id.toHexString(),
  displayName: `${input.firstName} ${input.lastName}`.trim() || input.email,
  avatarUrl: null,
});

const assertCanManageGroup = async (
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
      member.userId.equals(userObjectId) &&
      (member.role === "owner" ||
        (member.role === "admin" && member.invite.status === "accepted")),
  );

  if (!managerMembership) {
    throw new AuthError("Forbidden", 403);
  }
};

const syncGroupParticipants = async (
  groupId: string,
  ownerUserId: string,
  managerUserId: string,
  adminUserIds: string[],
  memberUserIds: string[],
): Promise<void> => {
  const normalizedAdmins = normalizeUserIds(adminUserIds, "adminUserId").filter(
    (userId) => userId !== ownerUserId,
  );
  const normalizedMembers = normalizeUserIds(
    memberUserIds,
    "memberUserId",
  ).filter(
    (userId) => userId !== ownerUserId && !normalizedAdmins.includes(userId),
  );

  const desiredParticipants = [
    {
      userId: ownerUserId,
      role: "owner" as GroupMemberRole,
      status: "accepted" as GroupMemberInviteStatus,
    },
    ...normalizedAdmins.map((userId) => ({
      userId,
      role: "admin" as GroupMemberRole,
      status: "accepted" as GroupMemberInviteStatus,
    })),
    ...normalizedMembers.map((userId) => ({
      userId,
      role: "member" as GroupMemberRole,
      status: "invited" as GroupMemberInviteStatus,
    })),
  ];

  const existingMembers = await listGroupMembersByGroupId(groupId, {
    includeDeleted: true,
    limit: 500,
  });
  const desiredUserIds = new Set(
    desiredParticipants.map((participant) => participant.userId),
  );
  const timestamp = new Date();

  for (const participant of desiredParticipants) {
    await saveGroupMember({
      groupId,
      userId: participant.userId,
      role: participant.role,
      invite: {
        invitedBy: managerUserId,
        invitedAt: timestamp,
        invitedUser: participant.userId,
        status: participant.status,
        statusChangedAt: timestamp,
      },
    });
  }

  for (const existingMember of existingMembers) {
    const memberUserId = existingMember.userId.toHexString();

    if (!desiredUserIds.has(memberUserId)) {
      await softDeleteGroupMemberByGroupAndUserId(groupId, memberUserId);
    }
  }
};

const toSaveResult = (input: {
  groupId: string;
  name: string;
  isActive: boolean;
}): SaveGroupResult => ({
  groupId: input.groupId,
  name: input.name,
  isActive: input.isActive,
});

export const listMyGroupsSummary = async (
  input: ListMyGroupsInput,
): Promise<ListMyGroupsResult> => {
  const pageSize = normalizePageSize(input.limit);
  const decodedCursor = decodeCursor(input.cursor);
  const userObjectId = ensureObjectId(input.userId, "userId");

  const groups = await listGroups({ limit: 500 });
  const items: GroupSummaryItem[] = [];

  for (const group of groups) {
    const members = await listGroupMembersByGroupId(group._id, { limit: 500 });

    const hasMembership = members.some(
      (member) =>
        member.userId.equals(userObjectId) &&
        (member.role === "owner" || member.invite.status === "accepted"),
    );

    if (!hasMembership) {
      continue;
    }

    const meetings = await listGroupMeetingsByGroupId(group._id, {
      limit: 500,
    });

    const activeMembers = members.filter(
      (member) =>
        member.role === "owner" || member.invite.status === "accepted",
    ).length;

    const invitedMembers = members.filter(
      (member) => member.invite.status === "invited",
    ).length;

    const pastMeetings = meetings.filter(
      (meeting) => meeting.status === "published",
    ).length;

    items.push(
      mapToGroupSummaryItem({
        groupId: group._id.toHexString(),
        name: group.name,
        recurrence: group.recurrenceRule.frequency,
        isActive: !group.deletedAt,
        activeMembers,
        invitedMembers,
        pastMeetings,
        nextUpcomingMeeting: null,
      }),
    );

    if (items.length >= pageSize) {
      break;
    }
  }

  return {
    items,
    nextCursor: null,
    pageSize,
    decodedCursor,
  };
};

export const searchGroupParticipants = async (
  input: SearchGroupParticipantsInput,
): Promise<SearchGroupParticipantsResultItem[]> => {
  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";
  const limit =
    typeof input.limit === "number" ? Math.min(input.limit, 25) : 10;
  const users = await listUsers({ limit: 100 });

  return users
    .filter((user) => {
      if (
        input.excludeUserId &&
        user._id.toHexString() === input.excludeUserId
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const fullName = `${user.firstName} ${user.lastName}`
        .trim()
        .toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      );
    })
    .slice(0, limit)
    .map((user) => ({
      userId: user._id.toHexString(),
      displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      avatarUrl: null,
    }));
};

export const createManagedGroup = async (
  input: GroupFormPayload,
  userId: string,
): Promise<SaveGroupResult> => {
  const ownerUserId = ensureObjectId(userId, "userId").toHexString();
  const group = await createGroup({
    name: input.name,
    ...(typeof input.description === "string"
      ? { description: input.description }
      : {}),
    ...(typeof input.publicMessage === "string"
      ? { publishEmailMessage: input.publicMessage }
      : {}),
    ...(typeof input.attendanceMessage === "string"
      ? { attendanceEmailMessage: input.attendanceMessage }
      : {}),
    publishHoursBefore: DEFAULT_PUBLISH_HOURS_BEFORE,
    notifyAttendanceHoursBefore: DEFAULT_ATTENDANCE_HOURS_BEFORE,
    ...(typeof input.address === "string" ? { address: input.address } : {}),
    startTime: parseTimeString(input.startTime),
    durationMinutes: input.durationMinutes,
    recurrenceRule: {
      frequency: input.recurrenceFrequency,
      daysOfWeek: input.recurrenceDaysOfWeek,
    },
  });

  const groupId = group._id.toHexString();
  await syncGroupParticipants(
    groupId,
    ownerUserId,
    ownerUserId,
    input.adminUserIds,
    input.memberUserIds,
  );

  return toSaveResult({
    groupId,
    name: group.name,
    isActive: !group.deletedAt,
  });
};

export const getManagedGroupForm = async (
  groupId: string,
  userId: string,
): Promise<EditableGroupFormResult> => {
  await assertCanManageGroup(groupId, userId);

  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  const members = await listGroupMembersByGroupId(groupId, { limit: 500 });
  const participantUsers = await listUsersByIds(
    members
      .filter((member) => member.role !== "owner")
      .map((member) => member.userId),
  );
  const usersById = new Map(
    participantUsers.map((participant) => [
      participant._id.toHexString(),
      toParticipantSummary(participant),
    ]),
  );

  const admins = members
    .filter((member) => member.role === "admin")
    .map((member) => usersById.get(member.userId.toHexString()))
    .filter((value): value is GroupFormParticipant => Boolean(value));

  const regularMembers = members
    .filter((member) => member.role === "member")
    .map((member) => usersById.get(member.userId.toHexString()))
    .filter((value): value is GroupFormParticipant => Boolean(value));

  return {
    groupId: group._id.toHexString(),
    isActive: !group.deletedAt,
    name: group.name,
    description: group.description,
    address: group.address,
    startTime: formatTimeString(group.startTime),
    durationMinutes: group.durationMinutes,
    recurrenceFrequency: group.recurrenceRule.frequency,
    recurrenceDaysOfWeek: group.recurrenceRule.daysOfWeek,
    publicMessage: group.publishEmailMessage,
    attendanceMessage: group.attendanceEmailMessage,
    admins,
    members: regularMembers,
  };
};

export const updateManagedGroup = async (
  groupId: string,
  input: GroupFormPayload,
  userId: string,
): Promise<SaveGroupResult> => {
  await assertCanManageGroup(groupId, userId);

  const updatedGroup = await updateGroupById(groupId, {
    name: input.name,
    ...(typeof input.description === "string"
      ? { description: input.description }
      : {}),
    ...(typeof input.publicMessage === "string"
      ? { publishEmailMessage: input.publicMessage }
      : {}),
    ...(typeof input.attendanceMessage === "string"
      ? { attendanceEmailMessage: input.attendanceMessage }
      : {}),
    ...(typeof input.address === "string" ? { address: input.address } : {}),
    startTime: parseTimeString(input.startTime),
    durationMinutes: input.durationMinutes,
    recurrenceRule: {
      frequency: input.recurrenceFrequency,
      daysOfWeek: input.recurrenceDaysOfWeek,
    },
  });

  if (!updatedGroup) {
    throw new Error("Group not found.");
  }

  const members = await listGroupMembersByGroupId(groupId, { limit: 500 });
  const owner = members.find((member) => member.role === "owner");

  if (!owner) {
    throw new Error("Group owner not found.");
  }

  await syncGroupParticipants(
    groupId,
    owner.userId.toHexString(),
    userId,
    input.adminUserIds,
    input.memberUserIds,
  );

  return toSaveResult({
    groupId: updatedGroup._id.toHexString(),
    name: updatedGroup.name,
    isActive: !updatedGroup.deletedAt,
  });
};
