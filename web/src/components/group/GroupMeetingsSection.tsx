import type { GroupMeetingPublic } from "@/api/types/groups";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateFormat";

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
            className="rounded-md border border-border/60 px-3 py-2 text-sm"
          >
            <p className="font-medium text-foreground">{meeting.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate.full(meeting.occursAt)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              Status: {meeting.status}
            </p>
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
