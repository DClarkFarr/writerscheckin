import { createGroupMeeting } from "../models/groupMeetings";
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
      member.userId.equals(userObjectId) &&
      (member.role === "owner" ||
        (member.role === "admin" && member.invite.status === "accepted")),
  );

  if (!managerMembership) {
    throw new AuthError("Forbidden", 403);
  }
};

export const createUpcomingMeetingFromDefaults = async (
  input: CreateUpcomingMeetingFromDefaultsInput,
): Promise<CreateUpcomingMeetingFromDefaultsResult> => {
  await assertCanManageGroupMeeting(input.groupId, input.userId);

  const group = await getGroupById(input.groupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  const meeting = await createGroupMeeting({
    groupId: group._id,
    name: group.name,
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

  const groupId = group._id.toHexString();
  const meetingId = meeting._id.toHexString();

  return {
    groupId,
    meetingId,
    redirectTo: `/groups/${groupId}/meetings/${meetingId}/edit`,
    createdFromDefaults: true,
  };
};
