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
  createdAt: string;
  isActive: boolean;
  userRole: GroupUserRole;
  counts: GroupSummaryCounts;
  nextUpcomingMeeting: GroupSummaryUpcomingMeeting | null;
  availableActions: GroupSummaryAvailableActions;
}

export interface ListMyGroupsInput {
  cursor?: string;
  limit?: number;
  status?: GroupMemberStatus;
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
export type GroupMemberRole = "admin" | "member" | "owner";
export type GroupMemberStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "cancelled"
  | "removed";

export interface GroupFormMember {
  _id?: string;
  identifier: string;
  role: GroupMemberRole;
  userId?: string | null;
  email?: string | null;
  name: string;
  avatarUrl: string | null;
  status: GroupMemberStatus;
}

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
  members: GroupFormMember[];
}

export interface EditableGroupResponse extends GroupSummaryItem {
  description: string;
  address: string;
  startTime: string;
  durationMinutes: number;
  recurrenceFrequency: GroupRecurrenceFrequency;
  recurrenceDaysOfWeek: number[];
  publicMessage: string;
  attendanceMessage: string;
}

export interface GroupMembersResponse {
  rows: GroupFormMember[];
  nextCursor: string | null;
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

export type GroupMeetingPublic = {
  meetingId: string;
  groupId: string;
  name: string;
  occursAt: string;
  description: string;
  address: string;
  startTime: {
    hours: number;
    minutes: number;
  };
  durationMinutes: number;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export interface GroupEventsResponse {
  rows: GroupMeetingPublic[];
  nextCursor: string | null;
}

export type MyMeetingsSegment = "upcoming" | "past";
export type MeetingPublicationStatus = "draft" | "published";
export type UserMeetingCheckinState =
  | "attending"
  | "reading"
  | "not_attending"
  | "none";
export type MeetingDisplayTone = "blue" | "red" | "gray";

export interface MeetingStartTime {
  hours: number;
  minutes: number;
}
export interface MyMeetingFeedItem {
  meetingId: string;
  groupId: string;
  groupName: string;
  name: string;
  occursAt: string;
  segment: MyMeetingsSegment;
  status: MeetingPublicationStatus;
  isAdminOnly: boolean;
  showAdminOnlyBadge: boolean;
  attendingCount: number;
  readingCount: number;
  userCheckinState: UserMeetingCheckinState;
  canCheckin: boolean;
  address: string;
  description: string;
  startTime: MeetingStartTime;
}

export interface ListMyMeetingsInput {
  cursor?: string;
  limit?: number;
}

export interface ListMyMeetingsResponse {
  items: MyMeetingFeedItem[];
  nextCursor: string | null;
}

export interface UpdateMeetingCheckinInput {
  state: "attending" | "reading" | "not_attending";
}

export interface UpdateMeetingCheckinResponse {
  meetingId: string;
  userCheckinState: "attending" | "reading" | "not_attending";
  attendingCount: number;
  readingCount: number;
  appliedAt: string;
}
