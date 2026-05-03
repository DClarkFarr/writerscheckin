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
  name: string;
  recurrence: string;
  createdAt: string;
  isActive: boolean;
  userRole: string;
  activeMembers?: number;
  invitedMembers?: number;
  pastMeetings?: number;
  nextUpcomingMeeting?: { meetingId: string; startsAt: string } | null;
}

export const buildActionAvailability = (
  isActive: boolean,
  hasUpcomingMeeting: boolean,
): GroupSummaryAvailableActions => ({
  canActivate: !isActive,
  canDeactivate: isActive,
  canViewUpcomingMeeting: hasUpcomingMeeting,
  canCreateManualMeeting: !hasUpcomingMeeting,
});

export const mapToGroupSummaryItem = (
  input: GroupSummaryMapperInput,
): GroupSummaryItem => {
  const nextUpcomingMeeting = input.nextUpcomingMeeting ?? null;

  return {
    groupId: input.groupId,
    name: input.name,
    recurrence: input.recurrence,
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
