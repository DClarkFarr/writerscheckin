export type JoinGroupInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "invalid";

export type InviteLinkAccessState =
  | "active_member"
  | "pending_invite"
  | "not_invited"
  | "declined_or_left"
  | "removed"
  | "unknown_or_expired";

export type InviteLinkAction =
  | "accept_invite"
  | "decline_invite"
  | "request_to_join"
  | "none";

export type InviteLinkMessageKey =
  | "inviteLink.activeMember"
  | "inviteLink.pendingInvite"
  | "inviteLink.notInvited"
  | "inviteLink.declinedOrLeft"
  | "inviteLink.removed"
  | "inviteLink.unknownOrExpired";

export interface InviteLinkAccessContext {
  groupId: string;
  groupName: string;
  groupDescription: string;
  meetingId: string;
  meetingTitle?: string;
  accessState: InviteLinkAccessState;
  messageKey: InviteLinkMessageKey;
  availableActions: InviteLinkAction[];
}

export interface JoinGroupInviteResponse {
  membershipId: string;
  groupId: string;
  groupName: string;
  address: string;
  nextMeetingStartsAt: string | null;
  meetingRecurrence: string;
  groupOwnerName: string;
  status: JoinGroupInviteStatus;
  canAccept: boolean;
  canDecline: boolean;
}

export type JoinGroupInviteAction = "accept" | "decline";

export interface RespondToJoinGroupInviteInput {
  action: JoinGroupInviteAction;
  inviteToken: string;
}

export interface RespondToJoinGroupInviteResponse {
  membershipId: string;
  groupId: string;
  status: "accepted" | "declined";
  actedAt: string;
  redirectTo: string;
}

export type MeetingInviteDecision = "accept" | "decline";

export interface RespondToMeetingInviteDecisionInput {
  groupId: string;
  meetingId: string;
  decision: MeetingInviteDecision;
}

export interface RespondToMeetingInviteDecisionResponse {
  updatedState: InviteLinkAccessState;
  messageKey: InviteLinkMessageKey;
  canProceedToMeeting: boolean;
}

export interface RequestToJoinMeetingInviteInput {
  groupId: string;
  meetingId: string;
}

export interface RequestToJoinMeetingInviteResponse {
  messageKey: "inviteLink.requestToJoinSent";
  delivered: boolean;
}
