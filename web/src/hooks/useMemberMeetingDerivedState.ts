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
    return "not_attending";
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
  meeting: Pick<MemberMeetingFeedItem, "occursAt" | "status">,
  now: Date = new Date(),
): boolean => {
  const occursAt = new Date(meeting.occursAt);
  return meeting.status === "published" && occursAt.getTime() > now.getTime();
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
    return attendanceState === "not_attending" ? "red" : "blue";
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
