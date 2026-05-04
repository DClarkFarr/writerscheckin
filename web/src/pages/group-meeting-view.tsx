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
import { useHomeStore } from "@/store/homeStore";
import { useMeetingViewQuery } from "@/queries/useMeetingViewQuery";
import { Button } from "@/components/ui/button";
import { formatStaticDateTime } from "@/lib/dateFormat";

export interface GroupMeetingViewPageProps {
  groupId: string;
  meetingId: string;
}

export function GroupMeetingViewPage({
  groupId,
  meetingId,
}: GroupMeetingViewPageProps) {
  const {
    data: meeting,
    isLoading,
    error,
  } = useMeetingViewQuery({
    groupId,
    meetingId,
  });

  const header = (
    <Breadcrumb variant="light">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/"
              onClick={() => useHomeStore.getState().setView("groups")}
            >
              My Groups
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/groups/$groupId/view" params={{ groupId }}>
              {meeting?.groupName || "Group"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{meeting?.name || "Meeting"}</BreadcrumbPage>
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
                {formatStaticDateTime(new Date(meeting.occursAt))}
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
                Time
              </p>
              <p className="text-sm">
                {meeting.startTime.hours.toString().padStart(2, "0")}:
                {meeting.startTime.minutes.toString().padStart(2, "0")} (
                {meeting.durationMinutes} minutes)
              </p>
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
            {meeting.participantRows.map((participant) => (
              <div
                key={participant.memberId}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
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
                      ? "Not responded"
                      : participant.attendanceState}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageCard>
  );
}
