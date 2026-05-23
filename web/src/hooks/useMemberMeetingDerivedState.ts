import { useMemo } from "react";
import type {
  MemberMeetingFeedItem,
  MeetingDisplayTone,
  UserMeetingCheckinState,
} from "@/api/types/groups";
import dayjs from "dayjs";

type MeetingTimeState = "upcoming" | "past" | "ongoing";
export type MemberMeetingCheckinWindowState =
  | "pre-open"
  | "open"
  | "closed"
  | "unavailable";

export interface MemberMeetingDerivedState {
  attendanceState: UserMeetingCheckinState;
  canCheckin: boolean;
  checkinWindowState: MemberMeetingCheckinWindowState;
  showAdminOnlyBadge: boolean;
  displayTone: MeetingDisplayTone;
  meetingTimeState: MeetingTimeState;
  canEdit: boolean;
  toBePublishedAt: string;
}

export const getUserCanEditMeeting = (
  meeting: Pick<MemberMeetingFeedItem, "membership">,
): boolean => {
  return (
    meeting.membership.role === "owner" || meeting.membership.role === "admin"
  );
};

export const getMemberMeetingAttendanceState = (
  meeting: Pick<MemberMeetingFeedItem, "attendance">,
): UserMeetingCheckinState => {
  const attendanceStatus = meeting.attendance?.status;

  if (!attendanceStatus || attendanceStatus === "invited") {
    return "none";
  }

  if (attendanceStatus === "skipping") {
    return "skipping";
  }

  return attendanceStatus;
};

export const getMemberMeetingTimeState = (
  meeting: Pick<MemberMeetingFeedItem, "occursAt" | "durationMinutes">,
  now: Date = new Date(),
) => {
  const occursAt = new Date(meeting.occursAt);
  const endsAt = new Date(occursAt.getTime() + meeting.durationMinutes * 60000);

  if (now.getTime() < occursAt.getTime()) {
    return "upcoming";
  } else if (
    now.getTime() >= occursAt.getTime() &&
    now.getTime() <= endsAt.getTime()
  ) {
    return "ongoing";
  } else {
    return "past";
  }
};
export const canCheckInToMemberMeeting = (
  meeting: Pick<
    MemberMeetingFeedItem,
    | "occursAt"
    | "publishHoursBefore"
    | "status"
    | "checkinClosesAt"
    | "endCheckinHoursBefore"
    | "isCheckinClosedByCuttoff"
  >,
  now: Date = new Date(),
): boolean => {
  return getMemberMeetingCheckinWindowState(meeting, now) === "open";
};

export const getMemberMeetingCheckinWindowState = (
  meeting: Pick<
    MemberMeetingFeedItem,
    | "occursAt"
    | "publishHoursBefore"
    | "status"
    | "checkinClosesAt"
    | "endCheckinHoursBefore"
    | "isCheckinClosedByCuttoff"
  >,
  now: Date = new Date(),
): MemberMeetingCheckinWindowState => {
  if (meeting.status !== "published") {
    return "unavailable";
  }

  const occursAt = new Date(meeting.occursAt);
  if (Number.isNaN(occursAt.getTime()) || occursAt.getTime() <= now.getTime()) {
    return "unavailable";
  }

  const checkinOpensAt = new Date(occursAt);
  checkinOpensAt.setHours(
    checkinOpensAt.getHours() - (meeting.publishHoursBefore ?? 0),
  );

  if (
    now.getTime() < checkinOpensAt.getTime() &&
    meeting.status !== "published"
  ) {
    return "pre-open";
  }

  if (meeting.isCheckinClosedByCuttoff === true) {
    return "closed";
  }

  const explicitClosesAt = meeting.checkinClosesAt
    ? new Date(meeting.checkinClosesAt)
    : null;
  const checkinClosesAt =
    explicitClosesAt && !Number.isNaN(explicitClosesAt.getTime())
      ? explicitClosesAt
      : (() => {
          const computed = new Date(occursAt);
          const endCheckinHoursBefore = meeting.endCheckinHoursBefore ?? 0;
          computed.setHours(computed.getHours() - endCheckinHoursBefore);
          return computed;
        })();

  if (checkinClosesAt.getTime() <= now.getTime()) {
    return "closed";
  }

  return "open";
};

export const showMemberMeetingAdminOnlyBadge = (
  meeting: Pick<MemberMeetingFeedItem, "status" | "membership">,
): boolean => {
  return (
    meeting.status === "draft" &&
    (meeting.membership.role === "owner" || meeting.membership.role === "admin")
  );
};

export const getMemberMeetingDisplayTone = (
  meeting: Pick<MemberMeetingFeedItem, "attendance" | "occursAt" | "status">,
  now: Date = new Date(),
): MeetingDisplayTone => {
  const attendanceState = getMemberMeetingAttendanceState(meeting);
  const occursAt = new Date(meeting.occursAt);
  if (occursAt.getTime() > now.getTime()) {
    return attendanceState === "skipping" ? "red" : "blue";
  }

  return "gray";
};

export const getMemberMeetingDerivedState = (
  meeting: MemberMeetingFeedItem,
  now: Date = new Date(),
): MemberMeetingDerivedState => {
  const checkinWindowState = getMemberMeetingCheckinWindowState(meeting, now);

  return {
    attendanceState: getMemberMeetingAttendanceState(meeting),
    canCheckin: checkinWindowState === "open",
    checkinWindowState,
    showAdminOnlyBadge: showMemberMeetingAdminOnlyBadge(meeting),
    displayTone: getMemberMeetingDisplayTone(meeting, now),
    meetingTimeState: getMemberMeetingTimeState(meeting, now),
    toBePublishedAt: dayjs(meeting.occursAt)
      .subtract(meeting.publishHoursBefore, "hour")
      .toISOString(),
    canEdit: getUserCanEditMeeting(meeting),
  };
};

export const useMemberMeetingDerivedState = (
  meeting: MemberMeetingFeedItem,
  now: Date = new Date(),
) => {
  return useMemo(
    () => getMemberMeetingDerivedState(meeting, now),
    [meeting, now],
  );
};
