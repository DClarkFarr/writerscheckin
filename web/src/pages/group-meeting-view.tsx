import { Link } from "@tanstack/react-router";
import { PageCard } from "@/components/layout/PageCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useMeetingViewQuery } from "@/queries/useMeetingViewQuery";
import { useMeetingCheckinMutation } from "@/queries/useMeetingCheckinMutation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  parseDateStrict,
  formatStaticDateTime,
  formatStaticFullDateTime,
} from "@/lib/dateFormat";
import {
  formatCheckinWindowMessage,
  getCheckinDisabledReason,
  resolveCheckinWindowUiState,
} from "@/lib/checkinWindowMessage";
import type {
  MeetingSocketPayload,
  UserMeetingCheckinState,
} from "@/api/types/groups";
import { useSocketStore } from "@/store/socketStore";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminUpgradeMeetingAttendeeStatus } from "@/api/groups";
import { useQueryClient } from "@tanstack/react-query";
import { meetingViewQueryKey } from "@/queries/useMeetingViewQuery";

import { InviteLinkStatusPanel } from "@/components/invite/InviteLinkStatusPanel";
import {
  useRequestToJoinMeetingInviteMutation,
  useRespondToMeetingInviteDecisionMutation,
} from "@/queries/useRespondToJoinInviteMutation";

export interface GroupMeetingViewPageProps {
  groupId: string;
  meetingId: string;
}

function getParticipantColors(checkinState: UserMeetingCheckinState) {
  switch (checkinState) {
    case "attending":
      return {
        borderColor: "border-green-500",
        bgColor: "bg-green-50",
      };
    case "reading":
      return {
        borderColor: "border-blue-500",
        bgColor: "bg-blue-50",
      };
    case "skipping":
      return {
        borderColor: "border-red-500",
        bgColor: "bg-red-50",
      };
    default:
      return {
        borderColor: "border-gray-300",
        bgColor: "bg-gray-50",
      };
  }
}

// Status hierarchy: reading (3) > attending (2) > skipping (1) > none (0)
const STATUS_HIERARCHY: Record<UserMeetingCheckinState, number> = {
  reading: 3,
  attending: 2,
  skipping: 1,
  none: 0,
};

const canDowngradeTo = (
  current: UserMeetingCheckinState,
  target: UserMeetingCheckinState,
): boolean => STATUS_HIERARCHY[target] < STATUS_HIERARCHY[current];

const canUpgradeTo = (
  current: UserMeetingCheckinState,
  target: UserMeetingCheckinState,
): boolean => STATUS_HIERARCHY[target] > STATUS_HIERARCHY[current];

const sortOrder: Record<UserMeetingCheckinState, number> = {
  reading: 0,
  attending: 1,
  skipping: 2,
  none: 3,
};

export function GroupMeetingViewPage({
  groupId,
  meetingId,
}: GroupMeetingViewPageProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [inviteDecisionMessage, setInviteDecisionMessage] = useState<
    string | null
  >(null);
  const [adminUpgradeState, setAdminUpgradeState] = useState<{
    memberId: string | null;
    isPending: boolean;
    error: string | null;
  }>({ memberId: null, isPending: false, error: null });

  const queryClient = useQueryClient();
  const checkinMutation = useMeetingCheckinMutation({ meetingId, groupId });
  const inviteDecisionMutation = useRespondToMeetingInviteDecisionMutation({
    groupId,
    meetingId,
  });
  const requestToJoinMutation = useRequestToJoinMeetingInviteMutation({
    groupId,
    meetingId,
  });
  const {
    data: meeting,
    isLoading,
    error,
    inviteLinkContext,
  } = useMeetingViewQuery({
    groupId,
    meetingId,
  });

  const participantRows = meeting?.participantRows;
  const sortedParticipants = useMemo(() => {
    if (!participantRows) return [];

    return participantRows.sort((a, b) => {
      const stateA = a.attendanceState;
      const stateB = b.attendanceState;

      return sortOrder[stateA] - sortOrder[stateB];
    });
  }, [participantRows]);

  useEffect(() => {
    if (!meeting?.checkinClosesAt) {
      return;
    }

    const occursAt = parseDateStrict(meeting.occursAt);
    const now = new Date();
    const checkinWindowState = resolveCheckinWindowUiState({
      canCheckin: meeting.canCheckin,
      isCheckinClosedByCuttoff: meeting.isCheckinClosedByCuttoff,
      isUpcomingMeeting: occursAt ? occursAt.isAfter(now) : false,
    });

    if (checkinWindowState !== "open") {
      return;
    }

    const closesAt = parseDateStrict(meeting.checkinClosesAt);
    if (!closesAt) {
      return;
    }

    (() => setCurrentTime(new Date()))();

    if (!closesAt.isAfter(new Date())) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!closesAt.isAfter(now)) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    meeting?.canCheckin,
    meeting?.checkinClosesAt,
    meeting?.isCheckinClosedByCuttoff,
    meeting?.occursAt,
  ]);

  const { socket } = useSocketStore();
  useEffect(() => {
    if (!socket) return;

    const handleMeetingUpdate = (payload: MeetingSocketPayload) => {
      if (payload.groupMeeting.meetingId === meetingId) {
        queryClient.invalidateQueries({
          queryKey: meetingViewQueryKey(groupId, meetingId),
        });
      }
    };

    socket.on("meeting", handleMeetingUpdate);
    return () => {
      socket.off("meeting", handleMeetingUpdate);
    };
  }, [socket, meetingId, groupId, queryClient]);

  const header = (
    <Breadcrumb variant="light">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">My Meetings</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage>Meeting Details</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (isLoading) {
    return (
      <PageCard grow header={header}>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading meeting...</p>
        </div>
      </PageCard>
    );
  }

  if (error || !meeting) {
    return (
      <PageCard grow header={header}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load meeting."}
          </p>
        </div>
      </PageCard>
    );
  }

  if (inviteLinkContext) {
    const handleAcceptInvite = async () => {
      try {
        const result = await inviteDecisionMutation.mutateAsync("accept");
        setInviteDecisionMessage(
          result.canProceedToMeeting
            ? "Invite accepted. You can now access this meeting."
            : "Invite accepted.",
        );
      } catch {
        setInviteDecisionMessage("Unable to accept invite right now.");
      }
    };

    const handleDeclineInvite = async () => {
      try {
        await inviteDecisionMutation.mutateAsync("decline");
        setInviteDecisionMessage(
          "Invite declined. You can request to join again later.",
        );
      } catch {
        setInviteDecisionMessage("Unable to decline invite right now.");
      }
    };

    const handleRequestToJoin = async () => {
      try {
        await requestToJoinMutation.mutateAsync();
        setInviteDecisionMessage(
          "Request sent. The group owner has been notified by email.",
        );
      } catch {
        setInviteDecisionMessage("Unable to send request to join right now.");
      }
    };

    return (
      <PageCard grow header={header}>
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {meeting.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatStaticDateTime(new Date(meeting.occursAt))}
            </p>
          </div>

          <InviteLinkStatusPanel
            context={inviteLinkContext}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
            onRequestToJoin={handleRequestToJoin}
            isActionPending={
              inviteDecisionMutation.isPending ||
              requestToJoinMutation.isPending
            }
          />

          {inviteDecisionMessage && (
            <Alert>
              <AlertDescription>{inviteDecisionMessage}</AlertDescription>
            </Alert>
          )}

          {inviteDecisionMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {inviteDecisionMutation.error.message ||
                  "Unable to update invite status right now."}
              </AlertDescription>
            </Alert>
          )}

          {requestToJoinMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {requestToJoinMutation.error.message ||
                  "Unable to send request to join right now."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </PageCard>
    );
  }

  const checkinWindowMessage = meeting.checkinClosesAt
    ? formatCheckinWindowMessage({
        checkinClosesAt: meeting.checkinClosesAt,
        now: currentTime,
      })
    : (meeting.checkinPeriodMessage ?? "Check-in period end time unavailable.");
  const occursAt = parseDateStrict(meeting.occursAt);
  const checkinWindowState = resolveCheckinWindowUiState({
    canCheckin: meeting.canCheckin,
    isCheckinClosedByCuttoff: meeting.isCheckinClosedByCuttoff,
    isUpcomingMeeting: occursAt ? occursAt.isAfter(currentTime) : false,
  });
  const canCheckinNow = checkinWindowState === "open";
  const isPeriodClosed = checkinWindowState === "closed";
  const currentCheckinState = meeting.userCheckinState;

  // Per-button enable logic: open → anything enabled; closed → downgrade only; else → disabled
  const isButtonEnabled = (targetState: UserMeetingCheckinState): boolean => {
    if (checkinMutation.isPending) return false;
    if (canCheckinNow) return true;
    if (!isPeriodClosed) return false;
    return canDowngradeTo(currentCheckinState, targetState);
  };

  const getButtonDisabledTooltip = (
    targetState: UserMeetingCheckinState,
  ): string | null => {
    if (!isPeriodClosed) return null;
    if (!canDowngradeTo(currentCheckinState, targetState)) {
      return "Check-in period has closed. Contact the group admin to upgrade your status.";
    }
    return null;
  };

  const disabledCheckinReason = getCheckinDisabledReason(checkinWindowState);
  const checkinErrorMessage =
    checkinMutation.error instanceof Error
      ? checkinMutation.error.message
      : "Unable to update your check-in status right now.";

  return (
    <PageCard grow header={header}>
      <div className="flex flex-col gap-6">
        {/* Meeting Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {meeting.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatStaticFullDateTime(new Date(meeting.occursAt))}
              </p>
            </div>
            {meeting.canEdit && (
              <Link
                to="/groups/$groupId/meetings/$meetingId/edit"
                params={{ groupId, meetingId }}
              >
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            )}
          </div>

          {/* Key Meeting Details */}
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="text-sm">{meeting.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="text-sm">{meeting.durationMinutes} minutes</p>
            </div>
            {meeting.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Details
                </p>
                <div
                  dangerouslySetInnerHTML={{ __html: meeting.description }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {!!meeting?.cancelledAt && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>
              <p className="text-lg">This meeting has been cancelled.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Check-In Actions */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            My Check-In Status
          </p>
          <p className="text-sm text-muted-foreground">
            {checkinWindowMessage}
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  className={
                    meeting.userCheckinState === "reading"
                      ? "bg-blue-700 text-white hover:bg-blue-700"
                      : "bg-blue-700/10 hover:bg-blue-700/20 text-gray-800 hover:text-gray-900"
                  }
                  disabled={!isButtonEnabled("reading")}
                  onClick={() => checkinMutation.mutate({ state: "reading" })}
                >
                  Reading
                </Button>
              </TooltipTrigger>
              {getButtonDisabledTooltip("reading") && (
                <TooltipContent>
                  <p>{getButtonDisabledTooltip("reading")}</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  className={
                    meeting.userCheckinState === "attending"
                      ? "bg-emerald-700 text-white hover:bg-emerald-700"
                      : "bg-emerald-700/10 hover:bg-emerald-700/20 text-gray-800 hover:text-gray-900"
                  }
                  disabled={!isButtonEnabled("attending")}
                  onClick={() => checkinMutation.mutate({ state: "attending" })}
                >
                  Attending
                </Button>
              </TooltipTrigger>
              {getButtonDisabledTooltip("attending") && (
                <TooltipContent>
                  <p>{getButtonDisabledTooltip("attending")}</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  className={
                    meeting.userCheckinState === "skipping"
                      ? "bg-red-700 text-white hover:bg-red-700"
                      : "bg-red-700/10 hover:bg-red-700/20 text-gray-800 hover:text-gray-900"
                  }
                  disabled={!isButtonEnabled("skipping")}
                  onClick={() =>
                    checkinMutation.mutate({ state: "not_attending" })
                  }
                >
                  Not Attending
                </Button>
              </TooltipTrigger>
              {getButtonDisabledTooltip("skipping") && (
                <TooltipContent>
                  <p>{getButtonDisabledTooltip("skipping")}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
          {isPeriodClosed && (
            <div className="border-l-2 border-amber-500 bg-amber-50 p-3 rounded space-y-1">
              <p className="text-sm font-medium text-amber-900">
                Check-in period has ended
              </p>
              <p className="text-xs text-amber-800">
                You can only downgrade your status. To increase your status,
                contact the group admin.
              </p>
            </div>
          )}
          {!canCheckinNow && !isPeriodClosed && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <p>{disabledCheckinReason}</p>
            </div>
          )}
          {Boolean(checkinMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>{checkinErrorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="flex gap-6 border-t pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attending
            </p>
            <p className="text-lg font-semibold">{meeting.attendingCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reading
            </p>
            <p className="text-lg font-semibold">{meeting.readingCount}</p>
          </div>
        </div>

        {/* Admin: Upgrade Attendee Status */}
        {meeting.canEdit && sortedParticipants.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin: Manage Attendee Status
            </p>
            <p className="text-xs text-muted-foreground">
              As an admin, you can upgrade any attendee&apos;s status at any
              time regardless of the check-in window.
            </p>
            {adminUpgradeState.error && (
              <Alert variant="destructive">
                <AlertDescription>{adminUpgradeState.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              {sortedParticipants
                .filter((p) => !p.isCurrentUser)
                .map((participant) => {
                  const current = participant.attendanceState;
                  const isPending =
                    adminUpgradeState.isPending &&
                    adminUpgradeState.memberId === participant.memberId;
                  const colors = getParticipantColors(current);

                  const handleAdminUpgrade = async (
                    newStatus: "attending" | "reading" | "skipping",
                  ) => {
                    setAdminUpgradeState({
                      memberId: participant.memberId,
                      isPending: true,
                      error: null,
                    });
                    try {
                      await adminUpgradeMeetingAttendeeStatus(
                        meetingId,
                        participant.memberId,
                        { status: newStatus },
                      );
                      await queryClient.invalidateQueries({
                        queryKey: meetingViewQueryKey(groupId, meetingId),
                      });
                      setAdminUpgradeState({
                        memberId: null,
                        isPending: false,
                        error: null,
                      });
                    } catch (err) {
                      setAdminUpgradeState({
                        memberId: participant.memberId,
                        isPending: false,
                        error:
                          err instanceof Error
                            ? err.message
                            : "Failed to upgrade status.",
                      });
                    }
                  };

                  return (
                    <div
                      key={participant.memberId}
                      className={`flex items-center justify-between rounded-md border p-3 text-sm ${colors.borderColor} ${colors.bgColor}`}
                    >
                      <div className="flex items-center gap-2">
                        {participant.avatarUrl && (
                          <img
                            src={participant.avatarUrl}
                            alt={participant.displayName}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {participant.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {current === "none" ? "No status" : current}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {canUpgradeTo(current, "attending") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => void handleAdminUpgrade("attending")}
                          >
                            → Attending
                          </Button>
                        )}
                        {canUpgradeTo(current, "reading") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => void handleAdminUpgrade("reading")}
                          >
                            → Reading
                          </Button>
                        )}
                        {current === "none" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => void handleAdminUpgrade("skipping")}
                          >
                            → Skipping
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Participants
          </p>
          <div className="space-y-2">
            {sortedParticipants.map((participant) => {
              const colors = getParticipantColors(participant.attendanceState);
              return (
                <div
                  key={participant.memberId}
                  className={`flex items-center justify-between rounded-md border p-3 text-sm ${colors.borderColor} ${colors.bgColor}`}
                >
                  <div className="flex items-center gap-2">
                    {participant.avatarUrl && (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.displayName}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {participant.displayName}
                        {participant.isCurrentUser && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium capitalize">
                      {participant.attendanceState === "none"
                        ? "Invited"
                        : participant.attendanceState}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageCard>
  );
}
