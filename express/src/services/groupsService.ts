import { ObjectId } from "mongodb";
import {
  encodeCursor,
  normalizePageSize,
  type DecodedCursor,
} from "../utils/pagination";
import {
  buildActionAvailability,
  mapToGroupSummaryItem,
  type GroupSummaryItem,
} from "./groupSummaryMapper";
import {
  createGroup,
  getGroupById,
  GroupDocument,
  listGroupsByIds,
  updateGroupById,
} from "../models/groups";
import {
  listGroupMembersByGroupId,
  getUserGroupMembership,
  updateGroupMemberById,
  listGroupMembershipsByUserIdPaginated,
  GroupMemberDocument,
} from "../models/groupMembers";
import {
  countGroupMeetingsByGroupId,
  getNextUpcomingMeetingByGroupId,
} from "../models/groupMeetings";
import { ensureObjectId } from "../models/types";
import { listUsers, listUsersByIds } from "../models/users";
import {
  assertTimeOfDay,
  type GroupMemberInviteStatus,
  type MeetingTimeOfDay,
} from "../models/groupModelCommon";
import { AuthError } from "./authService";
import { createNextUpcomingMeetingFromGroupDefaults } from "./groupMeetingsService";
import { addGroupMember, removeGroupMember } from "./groupMembersService";

import { recordAuditEvent } from "../utils/audit";

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

export interface GroupFormMemberInput {
  _id?: string;
  identifier: string;
  role: "admin" | "member";
}

export interface EditableGroupFormMember {
  _id: string;
  identifier: string;
  role: "admin" | "member" | "owner";
  userId: string | null;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  status: GroupMemberInviteStatus;
}

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
  members: GroupFormMemberInput[];
}

export interface EditableGroupFormResult {
  groupId: string;
  isActive: boolean;
  userRole: "owner" | "admin" | "member";
  name: string;
  recurrence: string;
  counts: {
    activeMembers: number;
    invitedMembers: number;
    pastMeetings: number;
  };
  nextUpcomingMeeting: {
    meetingId: string;
    startsAt: string;
  } | null;
  availableActions: {
    canActivate: boolean;
    canDeactivate: boolean;
    canViewUpcomingMeeting: boolean;
    canCreateManualMeeting: boolean;
  };
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: "weekly" | "biweekly";
  recurrenceDaysOfWeek: number[];
  publicMessage: string;
  attendanceMessage: string;
  members: EditableGroupFormMember[];
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

const normalizeMemberIdentifier = (identifier: string): string => {
  const trimmed = identifier.trim().toLowerCase();
  if (ObjectId.isValid(trimmed)) {
    return new ObjectId(trimmed).toHexString();
  }

  return trimmed;
};

const dedupeMembers = (
  members: GroupFormMemberInput[],
): GroupFormMemberInput[] => {
  const uniqueMembers = new Map<string, GroupFormMemberInput>();

  for (const member of members) {
    const normalizedIdentifier = normalizeMemberIdentifier(member.identifier);
    uniqueMembers.set(normalizedIdentifier, {
      ...member,
      identifier: normalizedIdentifier,
    });
  }

  return Array.from(uniqueMembers.values());
};

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
      member.userId?.equals(userObjectId) &&
      (member.role === "owner" ||
        (member.role === "admin" && member.status === "accepted")),
  );

  if (!managerMembership) {
    throw new AuthError("Forbidden", 403);
  }
};

const syncGroupMembers = async (
  groupId: string,
  ownerUserId: string,
  managerUserId: string,
  members: GroupFormMemberInput[],
): Promise<void> => {
  const desiredMembers = dedupeMembers(members).filter(
    (member) => member.identifier !== ownerUserId,
  );
  const desiredIdentifiers = new Set(
    desiredMembers.map((member) => member.identifier),
  );

  await addGroupMember({
    groupId,
    identifier: ownerUserId,
    role: "owner",
    invitedBy: managerUserId,
  });

  const existingMembers = await listGroupMembersByGroupId(groupId, {
    includeDeleted: true,
    limit: 500,
  });

  for (const member of desiredMembers) {
    await addGroupMember({
      groupId,
      identifier: member.identifier,
      role: member.role,
      invitedBy: managerUserId,
    });
  }

  for (const existingMember of existingMembers) {
    if (existingMember.role === "owner") {
      continue;
    }

    const existingIdentifier = existingMember.userId?.toHexString();
    if (!existingIdentifier) {
      continue;
    }

    if (!desiredIdentifiers.has(existingIdentifier)) {
      await removeGroupMember({
        groupId,
        memberId: existingMember._id.toHexString(),
      });
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

export interface ListMyGroupsProps {
  userId: string;
  cursor?: DecodedCursor | null;
  limit?: number | undefined;
  status?: GroupMemberInviteStatus | undefined;
}

export const listMyGroupsSummary = async (input: ListMyGroupsProps) => {
  const pageSize = normalizePageSize(input.limit);
  const userId = ensureObjectId(input.userId, "userId");
  const cursor = input.cursor ?? null;

  const { userMemberships, countAfter } =
    await listGroupMembershipsByUserIdPaginated({
      userId,
      limit: pageSize,
      cursor,
      status: input.status,
    });

  const groups = await listGroupsByIds({
    groupIds: userMemberships.map((membership) => membership.groupId),
  });

  const groupsWithMembers = await populateGroupsasSummaryItems(
    groups,
    userMemberships,
  );

  // Update cursor for next batch
  const lastGroup = groups.at(-1);
  if (lastGroup) {
  }
  // Determine if there are more items after the last one by checking if more groups exist after cursor
  const lastMembership = userMemberships.at(-1);
  let nextCursor: string | null = null;

  if (lastMembership) {
    // Check if there are more groups after the last item's cursor

    if (countAfter > 0) {
      nextCursor = encodeCursor({
        createdAt: new Date(lastMembership.createdAt),
        id: lastMembership._id.toHexString(),
      });
    }
  }

  return {
    items: groupsWithMembers,
    nextCursor,
    pageSize,
    decodedCursor: cursor,
  };
};

export const populateGroupsasSummaryItems = async (
  groups: GroupDocument[],
  userMemberships: GroupMemberDocument[],
) => {
  const userMembershipsMap = new Map<string, GroupMemberDocument>(
    userMemberships.map((membership) => [
      membership.groupId.toHexString(),
      membership,
    ]),
  );

  const summaryItems: Array<GroupSummaryItem> = [];

  for (const group of groups) {
    const [pastMeetings, nextUpcomingMeeting, members] = await Promise.all([
      countGroupMeetingsByGroupId(group._id, {
        status: "published",
        onlyPast: true,
      }),
      getNextUpcomingMeetingByGroupId(group._id),
      listGroupMembersByGroupId(group._id, {
        limit: 500,
        status: {
          $in: ["accepted", "invited"],
        },
      }),
    ]);

    const activeMembers = members.filter(
      (member) => member.status === "accepted",
    ).length;

    const invitedMembers = members.filter(
      (member) => member.status === "invited",
    ).length;

    const userMembership = userMembershipsMap.get(group._id.toHexString());
    if (!userMembership) {
      throw new Error(
        `User membership not found for group ${group._id.toHexString()}: ${group.name}`,
      );
    }
    const userRole = userMembership?.role ?? "member";

    summaryItems.push(
      mapToGroupSummaryItem({
        groupId: group._id.toHexString(),
        name: group.name,
        recurrence: group.recurrenceRule.frequency,
        isActive: !group.deletedAt,
        userRole,
        activeMembers,
        invitedMembers,
        pastMeetings,
        nextUpcomingMeeting: nextUpcomingMeeting
          ? {
              meetingId: nextUpcomingMeeting._id.toHexString(),
              startsAt: (
                nextUpcomingMeeting.occursAt ?? nextUpcomingMeeting.createdAt
              ).toISOString(),
            }
          : null,
      }),
    );
  }

  return summaryItems;
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
  await syncGroupMembers(groupId, ownerUserId, ownerUserId, input.members);

  await createNextUpcomingMeetingFromGroupDefaults(groupId);

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
  const userObjectId = ensureObjectId(userId, "userId");
  const userRole =
    members.find((member) => member.userId?.equals(userObjectId))?.role ??
    "member";
  const activeMembers = members.filter(
    (member) => member.role === "owner" || member.status === "accepted",
  ).length;
  const invitedMembers = members.filter(
    (member) => member.status === "invited",
  ).length;
  const [pastMeetings, nextUpcomingMeeting] = await Promise.all([
    countGroupMeetingsByGroupId(group._id, {
      status: "published",
      onlyPast: true,
    }),
    getNextUpcomingMeetingByGroupId(group._id),
  ]);
  const participantUsers = await listUsersByIds(
    members.flatMap((member) => (member.userId ? [member.userId] : [])),
  );
  const usersById = new Map(
    participantUsers.map((participant) => [
      participant._id.toHexString(),
      {
        userId: participant._id.toHexString(),
        name:
          `${participant.firstName} ${participant.lastName}`.trim() ||
          participant.email,
        email: participant.email,
        avatarUrl: null,
      },
    ]),
  );

  const editableMembers = members.flatMap((member) => {
    const userSummary = member.userId
      ? usersById.get(member.userId.toHexString())
      : null;
    const identifier = member.userId?.toHexString() ?? member.email;

    if (!identifier) {
      return [];
    }

    return [
      {
        _id: member._id.toHexString(),
        identifier,
        role: member.role,
        userId: member.userId?.toHexString() ?? null,
        email: member.email ?? userSummary?.email ?? null,
        name:
          userSummary?.name ??
          member.email ??
          member.userId?.toHexString() ??
          "Member",
        avatarUrl: userSummary?.avatarUrl ?? null,
        status: member.status,
      },
    ];
  });

  return {
    groupId: group._id.toHexString(),
    isActive: !group.deletedAt,
    userRole,
    name: group.name,
    recurrence: group.recurrenceRule.frequency,
    counts: {
      activeMembers,
      invitedMembers,
      pastMeetings,
    },
    nextUpcomingMeeting: nextUpcomingMeeting
      ? {
          meetingId: nextUpcomingMeeting._id.toHexString(),
          startsAt: (
            nextUpcomingMeeting.occursAt ?? nextUpcomingMeeting.createdAt
          ).toISOString(),
        }
      : null,
    availableActions: buildActionAvailability(
      !group.deletedAt,
      Boolean(nextUpcomingMeeting),
    ),
    description: group.description,
    address: group.address,
    startTime: formatTimeString(group.startTime),
    durationMinutes: group.durationMinutes,
    recurrenceFrequency: group.recurrenceRule.frequency,
    recurrenceDaysOfWeek: group.recurrenceRule.daysOfWeek,
    publicMessage: group.publishEmailMessage,
    attendanceMessage: group.attendanceEmailMessage,
    members: editableMembers,
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

  if (!owner.userId) {
    throw new Error("Group owner is missing a userId.");
  }

  await syncGroupMembers(
    groupId,
    owner.userId.toHexString(),
    userId,
    input.members,
  );

  return toSaveResult({
    groupId: updatedGroup._id.toHexString(),
    name: updatedGroup.name,
    isActive: !updatedGroup.deletedAt,
  });
};

export const leaveGroup = async (
  groupId: string,
  userId: string,
): Promise<void> => {
  const group = await getGroupById(groupId);

  if (!group) {
    throw new AuthError("Group not found", 404);
  }

  // Find the user's membership in the group
  const membership = await getUserGroupMembership(userId, groupId);

  if (!membership) {
    throw new AuthError("You are not a member of this group", 403);
  }

  // Verify the member has accepted their invite
  if (membership.status === "cancelled") {
    throw new AuthError("You have already left this group", 409);
  }

  if (membership.status !== "accepted") {
    throw new AuthError(
      "Cannot leave a group without an accepted membership",
      409,
    );
  }

  const updated = await updateGroupMemberById(membership._id, {
    status: "cancelled",
  });

  if (!updated) {
    throw new Error("Failed to update group membership");
  }

  // Record audit event
  recordAuditEvent({
    action: "user_left_group",
    userId,
    metadata: {
      groupId,
    },
  });
};
