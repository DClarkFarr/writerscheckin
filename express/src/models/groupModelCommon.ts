import { ObjectId } from "mongodb";
import { ensureObjectId, touchTimestamps } from "./types";

export const GROUP_MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];

export const GROUP_MEMBER_INVITE_STATUSES = [
  "invited",
  "accepted",
  "declined",
  "cancelled",
  "removed",
] as const;
export type GroupMemberInviteStatus =
  (typeof GROUP_MEMBER_INVITE_STATUSES)[number];

export const GROUP_MEETING_STATUSES = ["draft", "published"] as const;
export type GroupMeetingStatus = (typeof GROUP_MEETING_STATUSES)[number];

export const ATTENDANCE_STATUSES = [
  "invited",
  "attending",
  "reading",
  "skipping",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_LOG_STATUSES = [
  "attending",
  "reading",
  "skipping",
] as const;
export type AttendanceLogStatus = (typeof ATTENDANCE_LOG_STATUSES)[number];

export const RECURRENCE_FREQUENCIES = ["weekly", "biweekly"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface MeetingTimeOfDay {
  hours: number;
  minutes: number;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  daysOfWeek: number[];
}

export const assertQuarterHourMinutes = (minutes: number): void => {
  if (!Number.isInteger(minutes) || ![0, 15, 30, 45].includes(minutes)) {
    throw new Error("Meeting minutes must be in 15-minute increments.");
  }
};

export const assertHours = (hours: number): void => {
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
    throw new Error("Meeting hours must be between 0 and 23.");
  }
};

export const assertTimeOfDay = (timeOfDay: MeetingTimeOfDay): void => {
  assertHours(timeOfDay.hours);
  assertQuarterHourMinutes(timeOfDay.minutes);
};

export const assertDurationMinutes = (durationMinutes: number): void => {
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 60 ||
    durationMinutes > 240 ||
    durationMinutes % 15 !== 0
  ) {
    throw new Error(
      "Duration must be in 15-minute increments between 60 and 240 minutes.",
    );
  }
};

export const assertNonNegativeInteger = (
  value: number,
  label: string,
): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
};

const normalizeDays = (daysOfWeek: number[]): number[] => {
  if (!Array.isArray(daysOfWeek)) {
    throw new Error("daysOfWeek must be an array.");
  }

  const unique = Array.from(new Set(daysOfWeek));

  if (unique.length === 0) {
    throw new Error("daysOfWeek must contain at least one day.");
  }

  for (const day of unique) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new Error("daysOfWeek values must be integers between 0 and 6.");
    }
  }

  return unique.sort((a, b) => a - b);
};

export const assertRecurrenceRule = (
  recurrenceRule: RecurrenceRule,
): RecurrenceRule => {
  if (!RECURRENCE_FREQUENCIES.includes(recurrenceRule.frequency)) {
    throw new Error("Unsupported recurrence frequency.");
  }

  return {
    frequency: recurrenceRule.frequency,
    daysOfWeek: normalizeDays(recurrenceRule.daysOfWeek),
  };
};

export const assertRole = (role: string | null): GroupMemberRole => {
  if (!GROUP_MEMBER_ROLES.includes(role as GroupMemberRole)) {
    throw new Error("Unsupported group member role.");
  }

  return role as GroupMemberRole;
};

export const assertInviteStatus = (status: string): GroupMemberInviteStatus => {
  if (
    !GROUP_MEMBER_INVITE_STATUSES.includes(status as GroupMemberInviteStatus)
  ) {
    throw new Error("Unsupported invite status.");
  }

  return status as GroupMemberInviteStatus;
};

export const assertInviteStatusTransition = (
  currentStatus: GroupMemberInviteStatus,
  nextStatus: GroupMemberInviteStatus,
): void => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions: Record<
    GroupMemberInviteStatus,
    GroupMemberInviteStatus[]
  > = {
    invited: ["accepted", "declined", "removed"],
    accepted: ["cancelled", "removed"],
    declined: [],
    cancelled: ["removed"],
    removed: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(
      `Invalid invite status transition from ${currentStatus} to ${nextStatus}.`,
    );
  }
};

export const assertMeetingStatus = (status: string): GroupMeetingStatus => {
  if (!GROUP_MEETING_STATUSES.includes(status as GroupMeetingStatus)) {
    throw new Error("Unsupported group meeting status.");
  }

  return status as GroupMeetingStatus;
};

export const assertAttendanceStatus = (status: string): AttendanceStatus => {
  if (!ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) {
    throw new Error("Unsupported attendance status.");
  }

  return status as AttendanceStatus;
};

export const assertAttendanceLogStatus = (
  status: string,
): AttendanceLogStatus => {
  if (!ATTENDANCE_LOG_STATUSES.includes(status as AttendanceLogStatus)) {
    throw new Error("Unsupported attendance log status.");
  }

  return status as AttendanceLogStatus;
};

export const activeRecordFilter = (includeDeleted = false) =>
  includeDeleted ? {} : { deletedAt: { $exists: false } };

export const softDeletePatch = () => ({
  deletedAt: new Date(),
  ...touchTimestamps(),
});

export const toObjectId = (value: string | ObjectId, label: string): ObjectId =>
  ensureObjectId(value, label);
