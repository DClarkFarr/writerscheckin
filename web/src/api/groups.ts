import { apiClient } from "../lib/apiClient";
import { toApiError } from "./types";
import type {
  CreateUpcomingMeetingResponse,
  EditableGroupResponse,
  GroupFormDraft,
  GroupFormMember,
  GroupSummaryItem,
  ListMyGroupsInput,
  ListMyGroupsResponse,
  ParticipantSummary,
  SaveGroupResponse,
  SearchParticipantsResponse,
  UpdateGroupStateInput,
  UpdateGroupStateResponse,
} from "./types/groups";

const normalizeGroupSummaryItem = (
  item: GroupSummaryItem,
): GroupSummaryItem => ({
  ...item,
  recurrence: item.recurrence ?? "weekly",
  counts: {
    activeMembers: item.counts?.activeMembers ?? 0,
    invitedMembers: item.counts?.invitedMembers ?? 0,
    pastMeetings: item.counts?.pastMeetings ?? 0,
  },
  nextUpcomingMeeting: item.nextUpcomingMeeting
    ? {
        meetingId: item.nextUpcomingMeeting.meetingId,
        startsAt: item.nextUpcomingMeeting.startsAt,
      }
    : null,
  availableActions: {
    canActivate: item.availableActions?.canActivate ?? false,
    canDeactivate: item.availableActions?.canDeactivate ?? false,
    canViewUpcomingMeeting:
      item.availableActions?.canViewUpcomingMeeting ?? false,
    canCreateManualMeeting:
      item.availableActions?.canCreateManualMeeting ?? false,
  },
});

const normalizeListMyGroupsResponse = (
  data: ListMyGroupsResponse,
): ListMyGroupsResponse => ({
  items: Array.isArray(data.items)
    ? data.items.map((item) => normalizeGroupSummaryItem(item))
    : [],
  nextCursor: data.nextCursor ?? null,
});

const toGroupFormMember = (
  participant: ParticipantSummary,
  role: GroupFormMember["role"],
): GroupFormMember => ({
  identifier: participant.userId,
  userId: participant.userId,
  email: null,
  name: participant.displayName,
  avatarUrl: participant.avatarUrl,
  role,
  status: "accepted",
});

const normalizeEditableGroupResponse = (
  data: EditableGroupResponse & {
    admins?: ParticipantSummary[];
    members?: GroupFormMember[] | ParticipantSummary[];
  },
): EditableGroupResponse => {
  const hasUnifiedMembers =
    Array.isArray(data.members) &&
    data.members.some(
      (member): member is GroupFormMember =>
        "identifier" in member && "role" in member,
    );

  const legacyMembers = (Array.isArray(data.members)
    ? data.members
    : []
  ).filter(
    (participant) => "userId" in participant && "displayName" in participant,
  ) as unknown as ParticipantSummary[];

  const normalizedMembers = hasUnifiedMembers
    ? (data.members as GroupFormMember[]).map((member) => ({
        _id: member._id,
        identifier: member.identifier,
        userId: member.userId ?? null,
        email: member.email ?? null,
        name: member.name,
        avatarUrl: member.avatarUrl ?? null,
        role: member.role,
        status: member.status ?? "accepted",
      }))
    : [
        ...(Array.isArray(data.admins)
          ? data.admins.map((participant) =>
              toGroupFormMember(participant, "admin"),
            )
          : []),
        ...legacyMembers.map((participant) =>
          toGroupFormMember(participant, "member"),
        ),
      ];

  return {
    ...data,
    members: normalizedMembers,
  };
};

const toLegacyGroupPayload = (input: GroupFormDraft) => ({
  ...input,
  adminUserIds: input.members
    .filter((member) => member.role === "admin")
    .map((member) => member.identifier),
  memberUserIds: input.members
    .filter((member) => member.role === "member")
    .map((member) => member.identifier),
});

export async function listMyGroups(
  input: ListMyGroupsInput = {},
): Promise<ListMyGroupsResponse> {
  try {
    const { data } = await apiClient.get<ListMyGroupsResponse>("/groups/mine", {
      params: input,
    });
    return normalizeListMyGroupsResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateGroupState(
  groupId: string,
  input: UpdateGroupStateInput,
): Promise<UpdateGroupStateResponse> {
  try {
    const { data } = await apiClient.patch<UpdateGroupStateResponse>(
      `/groups/${groupId}`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createGroup(
  input: GroupFormDraft,
): Promise<SaveGroupResponse> {
  try {
    const { data } = await apiClient.post<SaveGroupResponse>(
      "/groups",
      toLegacyGroupPayload(input),
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function getGroupForm(
  groupId: string,
): Promise<EditableGroupResponse> {
  try {
    const { data } = await apiClient.get<EditableGroupResponse>(
      `/groups/${groupId}`,
    );
    return normalizeEditableGroupResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function getGroupById(
  groupId: string,
): Promise<EditableGroupResponse> {
  try {
    const { data } = await apiClient.get<EditableGroupResponse>(
      `/groups/${groupId}`,
    );
    return normalizeEditableGroupResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateGroup(
  groupId: string,
  input: GroupFormDraft,
): Promise<SaveGroupResponse> {
  try {
    const { data } = await apiClient.patch<SaveGroupResponse>(
      `/groups/${groupId}`,
      toLegacyGroupPayload(input),
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createUpcomingMeeting(
  groupId: string,
): Promise<CreateUpcomingMeetingResponse> {
  try {
    const { data } = await apiClient.post<CreateUpcomingMeetingResponse>(
      `/groups/${groupId}/meetings/upcoming`,
      {},
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function searchGroupParticipants(
  query: string,
): Promise<SearchParticipantsResponse> {
  try {
    const { data } = await apiClient.get<SearchParticipantsResponse>(
      "/groups/participants/search",
      {
        params: { q: query },
      },
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface MemberSearchResult {
  results: Array<{
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
  }>;
  inviteOption: { email: string; suggested: true } | null;
}

export async function searchMembers(
  query: string,
  groupId?: string,
  limit?: number,
): Promise<MemberSearchResult> {
  try {
    const { data } = await apiClient.get<MemberSearchResult>(
      "/members/search",
      {
        params: {
          q: query,
          ...(groupId ? { groupId } : {}),
          ...(typeof limit === "number" ? { limit } : {}),
        },
      },
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface LeaveGroupResponse {
  success: boolean;
  message: string;
}

export async function leaveGroup(groupId: string): Promise<LeaveGroupResponse> {
  try {
    const { data } = await apiClient.patch<LeaveGroupResponse>(
      `/groups/${groupId}/leave`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface RemoveGroupMemberResponse {
  success: boolean;
  message: string;
  memberStatus: string;
}

export async function removeGroupMember(
  groupId: string,
  memberId: string,
): Promise<RemoveGroupMemberResponse> {
  try {
    const { data } = await apiClient.delete<RemoveGroupMemberResponse>(
      `/groups/${groupId}/members/${memberId}`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface UpdateMemberRoleResponse {
  success: boolean;
  _id: string;
  role: string;
  updatedAt?: string;
}

export async function updateGroupMemberRole(
  groupId: string,
  memberId: string,
  role: string,
): Promise<UpdateMemberRoleResponse> {
  try {
    const { data } = await apiClient.patch<UpdateMemberRoleResponse>(
      `/groups/${groupId}/members/${memberId}/role`,
      { role },
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}
