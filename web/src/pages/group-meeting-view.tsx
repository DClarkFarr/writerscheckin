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
  formatStaticDateTime,
  formatStaticFullDateTime,
} from "@/lib/dateFormat";
import { formatCheckinWindowMessage } from "@/lib/checkinWindowMessage";
import type { UserMeetingCheckinState } from "@/api/types/groups";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [inviteDecisionMessage, setInviteDecisionMessage] = useState<
    string | null
  >(null);

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

  const checkinWindowMessage =
    meeting.checkinPeriodMessage ??
    (meeting.checkinClosesAt
      ? formatCheckinWindowMessage({
          checkinClosesAt: meeting.checkinClosesAt,
        })
      : "Check-in period end time unavailable.");
  const isCheckinCutoffClosed = meeting.isCheckinClosedByCuttoff === true;
  const disabledCheckinReason = isCheckinCutoffClosed
    ? "Check-in is closed because the cutoff time has passed."
    : "Check-in is unavailable for this meeting right now.";
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
            <Button
              type="button"
              className={
                meeting.userCheckinState === "reading"
                  ? "bg-blue-700 text-white hover:bg-blue-700"
                  : "bg-blue-700/10 hover:bg-blue-700/20 text-gray-800 hover:text-gray-900"
              }
              disabled={!meeting.canCheckin || checkinMutation.isPending}
              onClick={() =>
                checkinMutation.mutate({
                  state: "reading",
                })
              }
            >
              Reading
            </Button>
            <Button
              type="button"
              className={
                meeting.userCheckinState === "attending"
                  ? "bg-emerald-700 text-white hover:bg-emerald-700"
                  : "bg-emerald-700/10 hover:bg-emerald-700/20 text-gray-800 hover:text-gray-900"
              }
              disabled={!meeting.canCheckin || checkinMutation.isPending}
              onClick={() =>
                checkinMutation.mutate({
                  state: "attending",
                })
              }
            >
              Attending
            </Button>

            <Button
              type="button"
              className={
                meeting.userCheckinState === "skipping"
                  ? "bg-red-700 text-white hover:bg-red-700"
                  : "bg-red-700/10 hover:bg-red-700/20 text-gray-800 hover:text-gray-900"
              }
              disabled={!meeting.canCheckin || checkinMutation.isPending}
              onClick={() =>
                checkinMutation.mutate({
                  state: "not_attending",
                })
              }
            >
              Not Attending
            </Button>
          </div>
          {!meeting.canCheckin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <p>{disabledCheckinReason}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    aria-label="Why check-in is disabled"
                  >
                    Why?
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{disabledCheckinReason}</p>
                </TooltipContent>
              </Tooltip>
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
