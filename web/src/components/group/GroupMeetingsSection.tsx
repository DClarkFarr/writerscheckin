import type { GroupMeetingPublic } from "@/api/types/groups";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateFormat";
import { Link } from "@tanstack/react-router";
import IconEye from "~icons/mdi/eye";
import IconPencil from "~icons/mdi/pencil";

export interface GroupMeetingsSectionProps {
  meetings: GroupMeetingPublic[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function GroupMeetingsSection({
  meetings,
  isLoading,
  isError,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: GroupMeetingsSectionProps) {
  if (isLoading && meetings.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading meetings...</p>;
  }

  if (isError && meetings.length === 0) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage ?? "Unable to load meetings."}
      </p>
    );
  }

  if (meetings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No meetings available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {meetings.map((meeting) => (
          <li
            key={meeting.meetingId}
            className="rounded-md border border-border/60 px-3 py-2"
          >
            <div className="flex flex-col gap-2">
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">
                  {meeting.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate.full(meeting.occursAt)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  Status: {meeting.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/groups/$groupId/meetings/$meetingId/view"
                  params={{
                    groupId: meeting.groupId,
                    meetingId: meeting.meetingId,
                  }}
                >
                  <Button type="button" size="sm" variant="outline">
                    <IconEye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                </Link>
                <Link
                  to="/groups/$groupId/meetings/$meetingId/edit"
                  params={{
                    groupId: meeting.groupId,
                    meetingId: meeting.meetingId,
                  }}
                >
                  <Button type="button" size="sm" variant="outline">
                    <IconPencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More Meetings"}
          </Button>
        </div>
      )}
    </div>
  );
}
