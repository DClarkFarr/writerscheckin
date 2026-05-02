export interface GroupSummaryCounts {
  activeMembers: number;
  invitedMembers: number;
  pastMeetings: number;
}

export interface GroupSummaryUpcomingMeeting {
  meetingId: string;
  startsAt: string;
}

export interface GroupSummaryAvailableActions {
  canActivate: boolean;
  canDeactivate: boolean;
  canViewUpcomingMeeting: boolean;
  canCreateManualMeeting: boolean;
}

export type GroupUserRole = "owner" | "admin" | "member";
export interface GroupSummaryItem {
  groupId: string;
  name: string;
  recurrence: string;
  isActive: boolean;
  userRole: GroupUserRole;
  counts: GroupSummaryCounts;
  nextUpcomingMeeting: GroupSummaryUpcomingMeeting | null;
  availableActions: GroupSummaryAvailableActions;
}

export interface ListMyGroupsInput {
  cursor?: string;
  limit?: number;
}

export interface ListMyGroupsResponse {
  items: GroupSummaryItem[];
  nextCursor: string | null;
}

export interface UpdateGroupStateInput {
  active: boolean;
}

export interface UpdateGroupStateResponse {
  groupId: string;
  isActive: boolean;
  availableActions: GroupSummaryAvailableActions;
}

export interface ParticipantSummary {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface SearchParticipantsResponse {
  items: ParticipantSummary[];
}

export type GroupRecurrenceFrequency = "weekly" | "biweekly";

export interface GroupFormDraft {
  name: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: GroupRecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
  publicMessage: string;
  attendanceMessage: string;
  adminUserIds: string[];
  memberUserIds: string[];
}

export interface EditableGroupResponse {
  groupId: string;
  isActive: boolean;
  name: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: GroupRecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
  publicMessage: string;
  attendanceMessage: string;
  admins: ParticipantSummary[];
  members: ParticipantSummary[];
}

export interface SaveGroupResponse {
  groupId: string;
  name: string;
  isActive: boolean;
}

export interface CreateUpcomingMeetingResponse {
  groupId: string;
  meetingId: string;
  redirectTo: string;
  createdFromDefaults: true;
}
