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

export interface GroupSummaryItem {
  groupId: string;
  name: string;
  recurrence: string;
  isActive: boolean;
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
