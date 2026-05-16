import { ObjectId } from "mongodb";
import { ensureObjectId } from "../models/types";
import { app } from "../utils/app";
import { getGroupById } from "../models/groups";
import {
  getMembershipByGroup,
  listGroupMembersByGroupId,
  listGroupMembershipsByUserIdPaginated,
} from "../models/groupMembers";
import { populateGroupsasSummaryItems } from "./groupsService";

export const socketGroupEmitGroupSummaryItem = async (
  groupId: string | ObjectId,
) => {
  const id = ensureObjectId(groupId);

  const group = await getGroupById(id);
  if (!group) {
    return;
  }

  const sockets = await app.io?.in(id.toString()).fetchSockets();

  if (!sockets?.length) {
    return;
  }

  sockets.forEach(async (socket) => {
    const userId = socket.handshake.auth.userId;
    const socketId = socket.id;

    const userMembership = await getMembershipByGroup(userId, id);
    if (!userMembership) {
      return;
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
    app.io
      ?.to(id.toString()) // to room
      .to(socketId) // to specific socket
      .emit("group", groupsWithMembers[0]);
  });
};
