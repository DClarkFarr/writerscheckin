import type { InviteLinkAccessContext } from "./groupInvites";

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
}

export type GroupUserRole = "owner" | "admin" | "member";
export interface GroupSummaryItem {
  groupId: string;
  membershipId?: string;
  membershipCreatedAt?: string;
  name: string;
  address?: string;
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
  // HTML-compatible template source mapped to groups.publishEmailMessage.
  publicMessage: string;
  // HTML-compatible template source mapped to groups.attendanceEmailMessage.
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
  // Alias for groups.publishEmailMessage used by existing group form contract.
  publicMessage: string;
  // Alias for groups.attendanceEmailMessage used by existing group form contract.
  attendanceMessage: string;
}

export interface GroupMembersResponse {
  rows: GroupFormMember[];
  nextCursor: string | null;
}

export interface GroupMembershipResponse {
  membershipId: string;
  userId: string | null;
  email: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  createdAt: string;
  invitedBy: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
}

export type GroupInviteAction = "accept" | "decline";

export interface RespondToGroupInviteInput {
  action: GroupInviteAction;
}

export interface RespondToGroupInviteResponse {
  membershipId: string;
  groupId: string;
  status: "accepted" | "declined";
  actedAt: string;
  redirectTo: string | null;
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
  status: MeetingPublicationStatus;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export interface GroupEventsResponse {
  rows: GroupMeetingPublic[];
  nextCursor: string | null;
}

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

export interface MemberMeetingCounts {
  attending: number;
  reading: number;
}

export interface MemberMeetingAttendance {
  meetingAttendeeId: string;
  meetingId: string;
  memberId: string;
  status: "invited" | "attending" | "reading" | "skipping";
  createdAt: string;
  updatedAt: string;
}

export interface MemberMeetingFeedItem {
  meetingId: string;
  groupId: string;
  name: string;
  occursAt: string;
  description: string;
  address: string;
  startTime: MeetingStartTime;
  durationMinutes: number;
  // HTML-compatible meeting-level publish template.
  publishEmailMessage: string;
  // HTML-compatible meeting-level attendance template.
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: MeetingPublicationStatus;
  membership: GroupMembershipResponse;
  attendance: MemberMeetingAttendance | null;
  counts: MemberMeetingCounts;
  cancelledAt?: string | null;
}

export interface ListMemberMeetingsResponse {
  rows: MemberMeetingFeedItem[];
  nextCursor: string | null;
}

export interface MyMeetingFeedItem {
  meetingId: string;
  groupId: string;
  groupName: string;
  name: string;
  occursAt: string;
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

/**
 * Legacy contract retained temporarily while meetings/mine consumers migrate
 * to the aggregation-backed MemberMeetingFeedItem shape.
 */
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

export interface MeetingParticipantRow {
  memberId: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: GroupMemberRole;
  membershipStatus: GroupMemberStatus;
  attendanceState: UserMeetingCheckinState;
  isCurrentUser: boolean;
}

export interface MeetingDetailResponse {
  meetingId: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  name: string;
  occursAt: string;
  address: string;
  description: string;
  startTime: MeetingStartTime;
  durationMinutes: number;
  status: MeetingPublicationStatus;
  cancelledAt?: string;
  userCheckinState: UserMeetingCheckinState;
  canCheckin: boolean;
  canEdit: boolean;
  canCancel: boolean;
  attendingCount: number;
  readingCount: number;
  participantRows: MeetingParticipantRow[];
  inviteLinkContext?: InviteLinkAccessContext | null;
}

export interface EditableMeetingResponse {
  meetingId: string;
  groupId: string;
  name: string;
  occursAt: string;
  description: string;
  address: string;
  startTime: MeetingStartTime;
  durationMinutes: number;
  // HTML-compatible meeting-level publish template.
  publishEmailMessage: string;
  // HTML-compatible meeting-level attendance template.
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: MeetingPublicationStatus;
  cancelledAt?: string;
  publishScheduledFor: string | null;
  canPublishNow: boolean;
  canCancel: boolean;
  savedAt: string | null;
}

export interface UpdateMeetingInput {
  name?: string;
  occursAt?: string;
  description?: string;
  address?: string;
  startTime?: MeetingStartTime;
  durationMinutes?: number;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore?: number;
  notifyAttendanceHoursBefore?: number;
}

export interface UpdateMeetingResponse {
  meetingId: string;
  savedAt: string;
  status: MeetingPublicationStatus;
  publishScheduledFor: string | null;
  updatedFields: string[];
}

export interface PublishMeetingResponse {
  meetingId: string;
  status: "published";
  publishedAt: string;
  attendanceEnabled: boolean;
}

export interface CancelMeetingResponse {
  meetingId: string;
  status: "cancelled";
  cancelledAt: string;
}
