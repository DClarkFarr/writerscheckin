import { getMembershipByGroup } from "../models/groupMembers";
import { getGroupMeetingById } from "../models/groupMeetings";
import {
  getMeetingCheckinAggregate,
  setMeetingCheckinState,
  type MeetingCheckinState,
} from "../models/meetingCheckins";
import { AuthError } from "./authService";

export interface UpdateMeetingCheckinInput {
  meetingId: string;
  userId: string;
  state: MeetingCheckinState;
}

export interface UpdateMeetingCheckinResult {
  meetingId: string;
  userCheckinState: "attending" | "reading" | "not_attending";
  attendingCount: number;
  readingCount: number;
  appliedAt: string;
}

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
  if (occursAt.getTime() < Date.now()) {
    throw new AuthError(
      "Check-in can only be updated for upcoming meetings",
      409,
    );
  }

  await setMeetingCheckinState({
    meetingId: meeting._id,
    memberId: membership._id,
    state: input.state,
    logContext: {
      groupId: meeting.groupId,
      userId: membership.userId ?? input.userId,
    },
  });

  const aggregate = await getMeetingCheckinAggregate(meeting._id);

  return {
    meetingId: meeting._id.toHexString(),
    userCheckinState: input.state,
    attendingCount: aggregate.attendingCount,
    readingCount: aggregate.readingCount,
    appliedAt: new Date().toISOString(),
  };
};
