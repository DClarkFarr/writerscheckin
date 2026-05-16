export interface GroupSummaryAvailableActions {
  canActivate: boolean;
  canDeactivate: boolean;
  canViewUpcomingMeeting: boolean;
}

export interface GroupSummaryItem {
  groupId: string;
  membershipId?: string;
  membershipCreatedAt?: string;
  name: string;
  address?: string;
  recurrence: string;
  recurrenceDaysOfWeek: number[];
  createdAt: string;
  isActive: boolean;
  userRole: string;
  counts: {
    activeMembers: number;
    invitedMembers: number;
    pastMeetings: number;
  };
  nextUpcomingMeeting: {
    meetingId: string;
    startsAt: string;
  } | null;
  availableActions: GroupSummaryAvailableActions;
}

export interface GroupSummaryMapperInput {
  groupId: string;
  membershipId?: string;
  membershipCreatedAt?: string;
  name: string;
  address?: string;
  recurrence: string;
  recurrenceDaysOfWeek: number[];
  createdAt: string;
  isActive: boolean;
  userRole: string;
  activeMembers?: number;
  invitedMembers?: number;
  pastMeetings?: number;
  nextUpcomingMeeting?: { meetingId: string; startsAt: string } | null;
}

export interface InviteLinkGroupContextInput {
  groupId: string;
  name: string;
  description: string;
}

export interface InviteLinkGroupContext {
  groupId: string;
  groupName: string;
  groupDescription: string;
}

export const buildActionAvailability = (
  isActive: boolean,
  hasUpcomingMeeting: boolean,
): GroupSummaryAvailableActions => ({
  canActivate: !isActive,
  canDeactivate: isActive,
  canViewUpcomingMeeting: hasUpcomingMeeting,
});

export const mapToGroupSummaryItem = (
  input: GroupSummaryMapperInput,
): GroupSummaryItem => {
  const nextUpcomingMeeting = input.nextUpcomingMeeting ?? null;

  return {
    groupId: input.groupId,
    ...(input.membershipId ? { membershipId: input.membershipId } : {}),
    ...(input.membershipCreatedAt
      ? { membershipCreatedAt: input.membershipCreatedAt }
      : {}),
    name: input.name,
    ...(input.address ? { address: input.address } : {}),
    recurrence: input.recurrence,
    recurrenceDaysOfWeek: input.recurrenceDaysOfWeek,
    createdAt: input.createdAt,
    isActive: input.isActive,
    userRole: input.userRole,
    counts: {
      activeMembers: input.activeMembers ?? 0,
      invitedMembers: input.invitedMembers ?? 0,
      pastMeetings: input.pastMeetings ?? 0,
    },
    nextUpcomingMeeting,
    availableActions: buildActionAvailability(
      input.isActive,
      Boolean(nextUpcomingMeeting),
    ),
  };
};

export const mapToInviteLinkGroupContext = (
  input: InviteLinkGroupContextInput,
): InviteLinkGroupContext => {
  return {
    groupId: input.groupId,
    groupName: input.name,
    groupDescription: input.description,
  };
};
