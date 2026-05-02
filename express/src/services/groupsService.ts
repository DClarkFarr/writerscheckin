import {
  decodeCursor,
  normalizePageSize,
  type DecodedCursor,
} from "./groupsPagination";
import {
  mapToGroupSummaryItem,
  type GroupSummaryItem,
} from "./groupSummaryMapper";
import { listGroups } from "../models/groups";
import { listGroupMembersByGroupId } from "../models/groupMembers";
import { listGroupMeetingsByGroupId } from "../models/groupMeetings";
import { ensureObjectId } from "../models/types";

export interface ListMyGroupsInput {
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface ListMyGroupsResult {
  items: GroupSummaryItem[];
  nextCursor: string | null;
  pageSize: number;
  decodedCursor: DecodedCursor | null;
}

export const listMyGroupsSummary = async (
  input: ListMyGroupsInput,
): Promise<ListMyGroupsResult> => {
  const pageSize = normalizePageSize(input.limit);
  const decodedCursor = decodeCursor(input.cursor);
  const userObjectId = ensureObjectId(input.userId, "userId");

  const groups = await listGroups({ limit: 500 });
  const items: GroupSummaryItem[] = [];

  for (const group of groups) {
    const members = await listGroupMembersByGroupId(group._id, { limit: 500 });

    const hasMembership = members.some(
      (member) =>
        member.userId.equals(userObjectId) &&
        (member.role === "owner" || member.invite.status === "accepted"),
    );

    if (!hasMembership) {
      continue;
    }

    const meetings = await listGroupMeetingsByGroupId(group._id, {
      limit: 500,
    });

    const activeMembers = members.filter(
      (member) =>
        member.role === "owner" || member.invite.status === "accepted",
    ).length;

    const invitedMembers = members.filter(
      (member) => member.invite.status === "invited",
    ).length;

    const pastMeetings = meetings.filter(
      (meeting) => meeting.status === "published",
    ).length;

    items.push(
      mapToGroupSummaryItem({
        groupId: group._id.toHexString(),
        name: group.name,
        recurrence: group.recurrenceRule.frequency,
        isActive: !group.deletedAt,
        activeMembers,
        invitedMembers,
        pastMeetings,
        nextUpcomingMeeting: null,
      }),
    );

    if (items.length >= pageSize) {
      break;
    }
  }

  return {
    items,
    nextCursor: null,
    pageSize,
    decodedCursor,
  };
};
