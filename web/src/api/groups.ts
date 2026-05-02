import { apiClient } from "../lib/apiClient";
import { toApiError } from "./types";
import type {
  CreateUpcomingMeetingResponse,
  EditableGroupResponse,
  GroupFormDraft,
  GroupSummaryItem,
  ListMyGroupsInput,
  ListMyGroupsResponse,
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
    const { data } = await apiClient.post<SaveGroupResponse>("/groups", input);
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
    return data;
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
      input,
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
