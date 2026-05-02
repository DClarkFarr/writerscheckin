import {
  createGroupMeeting,
  getLatestUpcomingMeetingByGroupId,
} from "../models/groupMeetings";
import { getGroupById } from "../models/groups";
import { listGroupMembersByGroupId } from "../models/groupMembers";
import { ensureObjectId } from "../models/types";
import { AuthError } from "./authService";

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
