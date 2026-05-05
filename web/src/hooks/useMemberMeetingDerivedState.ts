import { useMemo } from "react";
import type {
  MemberMeetingFeedItem,
  MeetingDisplayTone,
  UserMeetingCheckinState,
} from "@/api/types/groups";

export interface MemberMeetingDerivedState {
  segment: "upcoming" | "past";
  attendanceState: UserMeetingCheckinState;
  canCheckin: boolean;
  showAdminOnlyBadge: boolean;
  displayTone: MeetingDisplayTone;
}

export const getMemberMeetingSegment = (
  meeting: Pick<MemberMeetingFeedItem, "occursAt">,
  now: Date = new Date(),
): "upcoming" | "past" => {
  const occursAt = new Date(meeting.occursAt);
  return occursAt.getTime() > now.getTime() ? "upcoming" : "past";
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

export const canCheckInToMemberMeeting = (
  meeting: Pick<MemberMeetingFeedItem, "occursAt" | "status">,
  now: Date = new Date(),
): boolean => {
  return (
    meeting.status === "published" &&
    getMemberMeetingSegment(meeting, now) === "upcoming"
  );
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
  const segment = getMemberMeetingSegment(meeting, now);
  const attendanceState = getMemberMeetingAttendanceState(meeting);

  if (segment === "upcoming") {
    return attendanceState === "not_attending" ? "red" : "blue";
  }

  return "gray";
};

export const getMemberMeetingDerivedState = (
  meeting: MemberMeetingFeedItem,
  now: Date = new Date(),
): MemberMeetingDerivedState => {
  return {
    segment: getMemberMeetingSegment(meeting, now),
    attendanceState: getMemberMeetingAttendanceState(meeting),
    canCheckin: canCheckInToMemberMeeting(meeting, now),
    showAdminOnlyBadge: showMemberMeetingAdminOnlyBadge(meeting),
    displayTone: getMemberMeetingDisplayTone(meeting, now),
  };
};

export const useMemberMeetingDerivedState = (
  meeting: MemberMeetingFeedItem,
  now: Date = new Date(),
): MemberMeetingDerivedState => {
  return useMemo(
    () => getMemberMeetingDerivedState(meeting, now),
    [meeting, now],
  );
};
