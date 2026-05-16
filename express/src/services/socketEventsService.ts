import { ObjectId } from "mongodb";
import { ensureObjectId } from "../models/types";
import { app } from "../utils/app";
import { getGroupById } from "../models/groups";
import { getMembershipByGroup } from "../models/groupMembers";
import {
  getMeetingAttendeeByMember,
  meetingAttendeeDocumentToResponse,
} from "../models/meetingAttendees";
import { getGroupMeetingById } from "../models/groupMeetings";
import { populateGroupsasSummaryItems } from "./groupsService";
import {
  mapGroupMeetingDocumentToSocketPayload,
  type GroupMeetingSocketPayloadDocument,
} from "./groupMeetingsService";
import { groupMemberDocumentToResponse } from "./groupMembersService";

export interface GroupMemberSocketPayloadDocument {
  membershipId: string;
  groupId: string;
  userId: string | null;
  email: string | undefined;
  role: "owner" | "admin" | "member";
  status: "accepted" | "invited" | "declined" | "cancelled" | "removed";
  createdAt: string;
  invitedBy: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
}

export type MeetingAttendeeSocketPayloadDocument = ReturnType<
  typeof meetingAttendeeDocumentToResponse
>;

export interface MeetingSocketPayload {
  groupMeeting: GroupMeetingSocketPayloadDocument;
  groupMember: GroupMemberSocketPayloadDocument;
  meetingAttendee: MeetingAttendeeSocketPayloadDocument | null;
}

const getGroupRoomSockets = async (groupId: ObjectId) => {
  // Both group and meeting emitters resolve recipients from the same group room.
  return app.io?.in(groupId.toHexString()).fetchSockets();
};

const emitToGroupSocket = (
  groupId: ObjectId,
  socketId: string,
  eventName: "group" | "meeting",
  payload: unknown,
) => {
  // Keep room+socket targeting consistent across socket event types.
  app.io?.to(groupId.toHexString()).to(socketId).emit(eventName, payload);
};

const mapGroupMemberToSocketPayload = (input: {
  groupId: ObjectId;
  membership: Awaited<ReturnType<typeof getMembershipByGroup>>;
}): GroupMemberSocketPayloadDocument => {
  const membership = input.membership;
  if (!membership) {
    throw new Error("Group membership is required for socket payload mapping.");
  }

  return {
    ...groupMemberDocumentToResponse(membership),
    groupId: input.groupId.toHexString(),
  };
};

const mapMeetingSocketPayload = (input: {
  groupMeeting: GroupMeetingSocketPayloadDocument;
  groupMember: GroupMemberSocketPayloadDocument;
  meetingAttendee: MeetingAttendeeSocketPayloadDocument | null;
}): MeetingSocketPayload => {
  return {
    groupMeeting: input.groupMeeting,
    groupMember: input.groupMember,
    meetingAttendee: input.meetingAttendee,
  };
};

export const socketGroupEmitGroupSummaryItem = async (
  groupId: string | ObjectId,
) => {
  const id = ensureObjectId(groupId);

  const group = await getGroupById(id);
  if (!group) {
    return;
  }

  const sockets = await getGroupRoomSockets(id);

  if (!sockets?.length) {
    return;
  }

  for (const socket of sockets) {
    const userId = socket.handshake.auth.userId;
    const socketId = socket.id;

    const userMembership = await getMembershipByGroup(userId, id);
    if (!userMembership) {
      continue;
    }

    const groupsWithMembers = await populateGroupsasSummaryItems(
      [group],
      [userMembership],
    );

    // console.log(
    //   "socket emitting group",
    //   groupsWithMembers[0]?.name,
    //   groupsWithMembers[0],
    // );
    emitToGroupSocket(id, socketId, "group", groupsWithMembers[0]);
  }
};

export const socketGroupEmitMeetingItem = async (
  groupId: string | ObjectId,
  meetingId: string | ObjectId,
) => {
  const id = ensureObjectId(groupId);
  const meeting = await getGroupMeetingById(meetingId);
  if (!meeting || !meeting.groupId.equals(id)) {
    return;
  }

  const sockets = await getGroupRoomSockets(id);
  if (!sockets?.length) {
    return;
  }

  const groupMeeting = mapGroupMeetingDocumentToSocketPayload(meeting);

  for (const socket of sockets) {
    const socketId = socket.id;
    const userId = socket.handshake.auth.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      continue;
    }

    const userMembership = await getMembershipByGroup(userId, id);
    if (!userMembership) {
      continue;
    }

    const attendee = await getMeetingAttendeeByMember(
      meeting._id,
      userMembership._id,
    );

    const groupMember = mapGroupMemberToSocketPayload({
      groupId: id,
      membership: userMembership,
    });
    const meetingAttendee = attendee
      ? meetingAttendeeDocumentToResponse(attendee)
      : null;

    const payload = mapMeetingSocketPayload({
      groupMeeting,
      groupMember,
      meetingAttendee,
    });

    console.log(
      "socket emitting meeting update for meeting",
      meeting.name,
      "room",
      id,
      "socketid",
      socketId,
      payload,
    );
    emitToGroupSocket(id, socketId, "meeting", payload);
  }
};
