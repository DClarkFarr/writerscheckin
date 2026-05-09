export type JoinGroupInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "invalid";

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
