import { getMembershipByGroup } from "../models/groupMembers";
import { getGroupMeetingById } from "../models/groupMeetings";
import {
  getMeetingCheckinAggregate,
  setMeetingCheckinState,
  type MeetingCheckinState,
} from "../models/meetingCheckins";
import {
  getMeetingAttendeeByMember,
  updateMeetingAttendeeStatusById,
} from "../models/meetingAttendees";
import { AuthError } from "./authService";
import type { AttendanceStatus } from "../models/groupModelCommon";

export interface UpdateMeetingCheckinInput {
  meetingId: string;
  userId: string;
  state: MeetingCheckinState;
}

export interface UpdateMeetingCheckinResult {
  meetingId: string;
  groupId: string;
  userCheckinState: "attending" | "reading" | "skipping";
  attendingCount: number;
  readingCount: number;
  appliedAt: string;
}

export interface AdminUpgradeMeetingAttendeeInput {
  meetingId: string;
  memberId: string;
  adminUserId: string;
  newStatus: AttendanceStatus;
}

// Status hierarchy: "reading" (highest) > "attending" > "skipping" (lowest)
const getStatusHierarchy = (status: AttendanceStatus): number => {
  const hierarchy: Record<AttendanceStatus, number> = {
    reading: 3,
    attending: 2,
    skipping: 1,
    invited: 0,
  };
  return hierarchy[status] ?? 0;
};

const canDowngradeTo = (
  currentStatus: AttendanceStatus,
  targetStatus: AttendanceStatus,
): boolean => {
  return getStatusHierarchy(targetStatus) < getStatusHierarchy(currentStatus);
};

const canUpgradeTo = (
  currentStatus: AttendanceStatus,
  targetStatus: AttendanceStatus,
): boolean => {
  return getStatusHierarchy(targetStatus) > getStatusHierarchy(currentStatus);
};

export const updateMeetingCheckin = async (
  input: UpdateMeetingCheckinInput,
): Promise<UpdateMeetingCheckinResult> => {
  const meeting = await getGroupMeetingById(input.meetingId);
  if (!meeting) {
    throw new AuthError("Meeting not found", 404);
  }

  const membership = await getMembershipByGroup(input.userId, meeting.groupId);
  if (!membership || membership.status !== "accepted") {
    throw new AuthError("Forbidden", 403);
  }

  const occursAt = meeting.occursAt ?? meeting.createdAt;
  const nowMs = Date.now();
  if (occursAt.getTime() < nowMs) {
    throw new AuthError(
      "Check-in can only be updated for upcoming meetings",
      409,
    );
  }

  const endCheckinHoursBefore = meeting.endCheckinHoursBefore ?? 0;
  const checkinClosesAt = new Date(occursAt);
  checkinClosesAt.setHours(checkinClosesAt.getHours() - endCheckinHoursBefore);

  const isClosed = nowMs >= checkinClosesAt.getTime();

  if (!isClosed) {
    // During open period, allow normal check-in
    await setMeetingCheckinState({
      meetingId: meeting._id,
      memberId: membership._id,
      state: input.state,
      logContext: {
        groupId: meeting.groupId,
        userId: membership.userId ?? input.userId,
      },
    });
  } else {
    // After check-in closes, only allow downgrades
    const attendee = await getMeetingAttendeeByMember(
      meeting._id,
      membership._id,
    );
    if (!attendee) {
      // If no attendee record exists, they haven't checked in yet - can't downgrade
      throw new AuthError(
        "You must check in before you can downgrade your status",
        409,
      );
    }

    const currentStatus = attendee.status;
    const targetState =
      input.state === "not_attending" ? "skipping" : input.state;

    if (!canDowngradeTo(currentStatus, targetState)) {
      throw new AuthError(
        "You can only downgrade your status after check-in closes. Contact the group admin to increase your status.",
        409,
      );
    }

    // Perform the downgrade
    const updated = await updateMeetingAttendeeStatusById(
      attendee._id,
      targetState,
      {
        groupId: meeting.groupId,
        userId: membership.userId ?? input.userId,
        changedBy: membership.userId ?? input.userId,
        isAdminOverride: false,
      },
    );

    if (!updated) {
      throw new AuthError("Failed to update status", 500);
    }
  }

  const aggregate = await getMeetingCheckinAggregate(meeting._id);

  return {
    meetingId: meeting._id.toHexString(),
    groupId: meeting.groupId.toHexString(),
    userCheckinState:
      input.state === "not_attending" ? "skipping" : input.state,
    attendingCount: aggregate.attendingCount,
    readingCount: aggregate.readingCount,
    appliedAt: new Date().toISOString(),
  };
};

export const adminUpgradeMeetingAttendee = async (
  input: AdminUpgradeMeetingAttendeeInput,
): Promise<UpdateMeetingCheckinResult> => {
  const meeting = await getGroupMeetingById(input.meetingId);
  if (!meeting) {
    throw new AuthError("Meeting not found", 404);
  }

  // Verify admin is authorized
  const adminMembership = await getMembershipByGroup(
    input.adminUserId,
    meeting.groupId,
  );
  if (
    !adminMembership ||
    adminMembership.status !== "accepted" ||
    (adminMembership.role !== "admin" && adminMembership.role !== "owner")
  ) {
    throw new AuthError("Only group admins can upgrade attendee status", 403);
  }

  // Get the attendee record by meeting + member lookup
  const attendee = await getMeetingAttendeeByMember(
    meeting._id,
    input.memberId,
  );
  if (!attendee) {
    throw new AuthError("Attendee not found for this member", 404);
  }

  const currentStatus = attendee.status;

  // Verify this is an upgrade (not a downgrade or same level)
  if (!canUpgradeTo(currentStatus, input.newStatus)) {
    throw new AuthError(
      "Admin can only upgrade attendee status, not downgrade",
      409,
    );
  }

  // Perform the upgrade
  const updated = await updateMeetingAttendeeStatusById(
    attendee._id,
    input.newStatus,
    {
      groupId: meeting.groupId,
      userId: input.adminUserId,
      changedBy: input.adminUserId,
      isAdminOverride: true,
    },
  );

  if (!updated) {
    throw new AuthError("Failed to update attendee status", 500);
  }

  const aggregate = await getMeetingCheckinAggregate(meeting._id);

  return {
    meetingId: meeting._id.toHexString(),
    groupId: meeting.groupId.toHexString(),
    userCheckinState: (input.newStatus === "skipping"
      ? "skipping"
      : input.newStatus === "attending"
        ? "attending"
        : "reading") as "attending" | "reading" | "skipping",
    attendingCount: aggregate.attendingCount,
    readingCount: aggregate.readingCount,
    appliedAt: new Date().toISOString(),
  };
};
