import { apiClient } from "../lib/apiClient";
import { toApiError } from "./types";
import type {
  CancelMeetingResponse,
  CreateUpcomingMeetingResponse,
  EditableMeetingResponse,
  EditableGroupResponse,
  GroupEventsResponse,
  GroupFormDraft,
  GroupMeetingPublic,
  GroupMembershipResponse,
  GroupMembersResponse,
  GroupSummaryItem,
  ListMemberMeetingsResponse,
  ListMyMeetingsInput,
  ListMyGroupsInput,
  ListMyGroupsResponse,
  MemberMeetingAttendance,
  MemberMeetingFeedItem,
  MeetingDetailResponse,
  MeetingParticipantRow,
  PublishMeetingResponse,
  SaveGroupResponse,
  SearchParticipantsResponse,
  UpdateMeetingInput,
  UpdateMeetingCheckinInput,
  UpdateMeetingCheckinResponse,
  UpdateMeetingResponse,
  UpdateGroupStateInput,
  UpdateGroupStateResponse,
} from "./types/groups";

const normalizeGroupSummaryItem = (
  item: GroupSummaryItem,
): GroupSummaryItem => ({
  ...item,
  recurrence: item.recurrence ?? "weekly",
  createdAt: item.createdAt ?? new Date(0).toISOString(),
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

const normalizeEditableGroupResponse = (
  data: EditableGroupResponse,
): EditableGroupResponse => {
  return {
    ...data,
    recurrence: data.recurrence ?? data.recurrenceFrequency ?? "weekly",
    counts: {
      activeMembers: data.counts?.activeMembers ?? 0,
      invitedMembers: data.counts?.invitedMembers ?? 0,
      pastMeetings: data.counts?.pastMeetings ?? 0,
    },
    nextUpcomingMeeting: data.nextUpcomingMeeting
      ? {
          meetingId: data.nextUpcomingMeeting.meetingId,
          startsAt: data.nextUpcomingMeeting.startsAt,
        }
      : null,
    availableActions: {
      canActivate: data.availableActions?.canActivate ?? false,
      canDeactivate: data.availableActions?.canDeactivate ?? false,
      canViewUpcomingMeeting:
        data.availableActions?.canViewUpcomingMeeting ?? false,
    },
  };
};

const normalizeGroupMembersResponse = (
  data: GroupMembersResponse,
): GroupMembersResponse => ({
  rows: Array.isArray(data.rows)
    ? data.rows.map((member) => ({
        _id: member._id,
        identifier: member.identifier,
        userId: member.userId ?? null,
        email: member.email ?? null,
        name: member.name,
        avatarUrl: member.avatarUrl ?? null,
        role: member.role,
        status: member.status ?? "accepted",
      }))
    : [],
  nextCursor: data.nextCursor ?? null,
});

const normalizeGroupEventsResponse = (
  data: GroupEventsResponse,
): GroupEventsResponse => ({
  rows: Array.isArray(data.rows)
    ? data.rows.map(
        (meeting): GroupMeetingPublic => ({
          meetingId: meeting.meetingId,
          groupId: meeting.groupId,
          name: meeting.name,
          occursAt: meeting.occursAt,
          description: meeting.description ?? "",
          address: meeting.address ?? "",
          startTime: meeting.startTime,
          durationMinutes: meeting.durationMinutes,
          publishHoursBefore: meeting.publishHoursBefore,
          notifyAttendanceHoursBefore: meeting.notifyAttendanceHoursBefore,
          status: meeting.status,
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
          ...(meeting.deletedAt ? { deletedAt: meeting.deletedAt } : {}),
        }),
      )
    : [],
  nextCursor: data.nextCursor ?? null,
});

const normalizeGroupMembershipResponse = (
  membership: GroupMembershipResponse,
): GroupMembershipResponse => ({
  membershipId: membership.membershipId,
  userId: membership.userId ?? null,
  email: membership.email ?? "",
  role: membership.role,
  status: membership.status,
  createdAt: membership.createdAt ?? new Date(0).toISOString(),
  invitedBy: membership.invitedBy ?? null,
  invitedAt: membership.invitedAt ?? null,
  acceptedAt: membership.acceptedAt ?? null,
});

const normalizeMemberMeetingAttendance = (
  attendance: MemberMeetingAttendance | null,
): MemberMeetingAttendance | null => {
  if (!attendance) {
    return null;
  }

  return {
    meetingAttendeeId: attendance.meetingAttendeeId,
    meetingId: attendance.meetingId,
    memberId: attendance.memberId,
    status: attendance.status,
    createdAt: attendance.createdAt ?? new Date(0).toISOString(),
    updatedAt: attendance.updatedAt ?? new Date(0).toISOString(),
  };
};

const normalizeMemberMeetingFeedItem = (
  item: MemberMeetingFeedItem,
): MemberMeetingFeedItem => ({
  ...item,
  address: item.address ?? "",
  description: item.description ?? "",
  startTime: item.startTime ?? { hours: 0, minutes: 0 },
  durationMinutes: item.durationMinutes ?? 0,
  publishEmailMessage: item.publishEmailMessage ?? "",
  attendanceEmailMessage: item.attendanceEmailMessage ?? "",
  publishHoursBefore: item.publishHoursBefore ?? 0,
  notifyAttendanceHoursBefore: item.notifyAttendanceHoursBefore ?? 0,
  membership: normalizeGroupMembershipResponse(item.membership),
  attendance: normalizeMemberMeetingAttendance(item.attendance),
  counts: {
    attending: item.counts?.attending ?? 0,
    reading: item.counts?.reading ?? 0,
  },
});

const normalizeListMemberMeetingsResponse = (
  data: ListMemberMeetingsResponse,
): ListMemberMeetingsResponse => ({
  rows: Array.isArray(data.rows)
    ? data.rows.map((item) => normalizeMemberMeetingFeedItem(item))
    : [],
  nextCursor: data.nextCursor ?? null,
});

const normalizeMeetingParticipantRow = (
  row: MeetingParticipantRow,
): MeetingParticipantRow => ({
  ...row,
  userId: row.userId ?? null,
  avatarUrl: row.avatarUrl ?? null,
  attendanceState: row.attendanceState ?? "none",
  isCurrentUser: row.isCurrentUser ?? false,
});

const normalizeMeetingDetailResponse = (
  data: MeetingDetailResponse,
): MeetingDetailResponse => ({
  ...data,
  address: data.address ?? "",
  description: data.description ?? "",
  startTime: data.startTime ?? { hours: 0, minutes: 0 },
  durationMinutes: data.durationMinutes ?? 0,
  userCheckinState: data.userCheckinState ?? "none",
  canCheckin: data.canCheckin ?? false,
  canEdit: data.canEdit ?? false,
  attendingCount: data.attendingCount ?? 0,
  readingCount: data.readingCount ?? 0,
  canCancel: data.canCancel ?? false,
  participantRows: Array.isArray(data.participantRows)
    ? data.participantRows.map((row) => normalizeMeetingParticipantRow(row))
    : [],
});

const normalizeEditableMeetingResponse = (
  data: EditableMeetingResponse,
): EditableMeetingResponse => ({
  ...data,
  description: data.description ?? "",
  address: data.address ?? "",
  startTime: data.startTime ?? { hours: 0, minutes: 0 },
  durationMinutes: data.durationMinutes ?? 0,
  publishEmailMessage: data.publishEmailMessage ?? "",
  attendanceEmailMessage: data.attendanceEmailMessage ?? "",
  publishHoursBefore: data.publishHoursBefore ?? 0,
  notifyAttendanceHoursBefore: data.notifyAttendanceHoursBefore ?? 0,
  publishScheduledFor: data.publishScheduledFor ?? null,
  canPublishNow: data.canPublishNow ?? false,
  savedAt: data.savedAt ?? null,
  canCancel: data.canCancel ?? false,
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

export async function getMyMeetings(
  input: ListMyMeetingsInput = {},
): Promise<ListMemberMeetingsResponse> {
  try {
    const { data } = await apiClient.get<ListMemberMeetingsResponse>(
      "/groups/meetings/mine",
      {
        params: input,
      },
    );
    return normalizeListMemberMeetingsResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateMeetingCheckin(
  meetingId: string,
  input: UpdateMeetingCheckinInput,
): Promise<UpdateMeetingCheckinResponse> {
  try {
    const { data } = await apiClient.post<UpdateMeetingCheckinResponse>(
      `/groups/meetings/${meetingId}/checkin`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function getMeetingDetail(
  groupId: string,
  meetingId: string,
): Promise<MeetingDetailResponse> {
  try {
    const { data } = await apiClient.get<MeetingDetailResponse>(
      `/groups/${groupId}/meetings/${meetingId}`,
    );
    return normalizeMeetingDetailResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function getEditableMeeting(
  groupId: string,
  meetingId: string,
): Promise<EditableMeetingResponse> {
  try {
    const { data } = await apiClient.get<EditableMeetingResponse>(
      `/groups/${groupId}/meetings/${meetingId}/edit`,
    );
    return normalizeEditableMeetingResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateMeeting(
  groupId: string,
  meetingId: string,
  input: UpdateMeetingInput,
): Promise<UpdateMeetingResponse> {
  try {
    const { data } = await apiClient.patch<UpdateMeetingResponse>(
      `/groups/${groupId}/meetings/${meetingId}/edit`,
      input,
    );
    return {
      meetingId: data.meetingId,
      savedAt: data.savedAt,
      status: data.status,
      publishScheduledFor: data.publishScheduledFor ?? null,
      updatedFields: Array.isArray(data.updatedFields)
        ? data.updatedFields
        : [],
    };
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function publishMeeting(
  groupId: string,
  meetingId: string,
): Promise<PublishMeetingResponse> {
  try {
    const { data } = await apiClient.post<PublishMeetingResponse>(
      `/groups/${groupId}/meetings/${meetingId}/publish`,
      {},
    );
    return {
      meetingId: data.meetingId,
      status: data.status,
      publishedAt: data.publishedAt,
      attendanceEnabled: data.attendanceEnabled ?? false,
    };
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function cancelMeeting(
  groupId: string,
  meetingId: string,
): Promise<CancelMeetingResponse> {
  try {
    const { data } = await apiClient.post<CancelMeetingResponse>(
      `/groups/${groupId}/meetings/${meetingId}/cancel`,
      {},
    );
    return {
      meetingId: data.meetingId,
      status: data.status,
      cancelledAt: data.cancelledAt,
    };
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
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface GetGroupMembersProps {
  groupId: string;
  cursor?: string;
  limit?: number;
}

export async function getGroupMembers({
  groupId,
  cursor,
  limit,
}: GetGroupMembersProps): Promise<GroupMembersResponse> {
  try {
    const { data } = await apiClient.get<GroupMembersResponse>(
      `/groups/${groupId}/members`,
      {
        params: {
          cursor,
          limit,
        },
      },
    );

    return normalizeGroupMembersResponse(data);
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

export interface GetGroupMeetingsProps {
  groupId: string;
  cursor?: string;
  limit?: number;
}
export async function getGroupMeetings({
  groupId,
  cursor,
  limit,
}: GetGroupMeetingsProps): Promise<GroupEventsResponse> {
  try {
    const { data } = await apiClient.get<GroupEventsResponse>(
      `/groups/${groupId}/meetings`,
      {
        params: {
          cursor,
          limit,
        },
      },
    );
    return normalizeGroupEventsResponse(data);
  } catch (err) {
    throw await toApiError(err);
  }
}
