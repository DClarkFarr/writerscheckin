import { useMemo } from "react";
import type {
  MemberMeetingFeedItem,
  MeetingDisplayTone,
  UserMeetingCheckinState,
} from "@/api/types/groups";
import dayjs from "dayjs";

type MeetingTimeState = "upcoming" | "past" | "ongoing";
export interface MemberMeetingDerivedState {
  attendanceState: UserMeetingCheckinState;
  canCheckin: boolean;
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
    | "status"
    | "checkinClosesAt"
    | "endCheckinHoursBefore"
    | "isCheckinClosedByCuttoff"
  >,
  now: Date = new Date(),
): boolean => {
  if (meeting.status !== "published") {
    return false;
  }

  const occursAt = new Date(meeting.occursAt);
  if (Number.isNaN(occursAt.getTime()) || occursAt.getTime() <= now.getTime()) {
    return false;
  }

  if (meeting.isCheckinClosedByCuttoff === true) {
    return false;
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

  return checkinClosesAt.getTime() > now.getTime();
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
  return {
    attendanceState: getMemberMeetingAttendanceState(meeting),
    canCheckin: canCheckInToMemberMeeting(meeting, now),
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
