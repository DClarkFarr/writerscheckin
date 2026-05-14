import type {
  InviteLinkAccessState,
  InviteLinkAction,
  InviteLinkMessageKey,
} from "@/api/types/groupInvites";

export interface InviteLinkStatusConfig {
  messageKey: InviteLinkMessageKey;
  title: string;
  description: string;
  availableActions: InviteLinkAction[];
}

export const INVITE_LINK_STATUS_CONFIG: Record<
  InviteLinkAccessState,
  InviteLinkStatusConfig
> = {
  active_member: {
    messageKey: "inviteLink.activeMember",
    title: "You can access this meeting",
    description: "Your membership is active and this invite link is valid.",
    availableActions: ["none"],
  },
  pending_invite: {
    messageKey: "inviteLink.pendingInvite",
    title: "You have been invited",
    description:
      "Accept or decline this group invitation to continue to meeting details.",
    availableActions: ["accept_invite", "decline_invite"],
  },
  not_invited: {
    messageKey: "inviteLink.notInvited",
    title: "You are not currently invited",
    description:
      "This meeting belongs to a group that has not invited your account.",
    availableActions: ["none"],
  },
  declined_or_left: {
    messageKey: "inviteLink.declinedOrLeft",
    title: "You are not an active group member",
    description:
      "You can contact the group owner or request to join again from this page.",
    availableActions: ["request_to_join"],
  },
  removed: {
    messageKey: "inviteLink.removed",
    title: "Your membership was removed",
    description:
      "Contact the group owner if you need another invitation, or request to join again.",
    availableActions: ["request_to_join"],
  },
  unknown_or_expired: {
    messageKey: "inviteLink.unknownOrExpired",
    title: "This invite link is no longer active",
    description:
      "The invite may have expired or changed. Contact the group owner for help.",
    availableActions: ["none"],
  },
};
