import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GroupMeetingsSection } from "@/components/group/GroupMeetingsSection";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { useGroupMeetingsQuery } from "@/queries/useGroupMeetingsQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupQuery } from "@/queries/useGroupQuery";

export interface GroupSummaryModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupSummaryModal({
  groupId,
  isOpen,
  onClose,
}: GroupSummaryModalProps) {
  const { data, isLoading, isError } = useGroupQuery(
    { groupId },
    { enabled: isOpen },
  );
  const {
    members,
    isLoading: isMembersLoading,
    isError: isMembersError,
    errorMessage: membersErrorMessage,
    fetchNextPage: loadMoreMembers,
    hasNextPage: hasMoreMembers,
    isFetchingNextPage: isFetchingMoreMembers,
  } = useGroupMembersQuery({ groupId, limit: 20 }, { enabled: isOpen });
  const {
    meetings,
    isLoading: isMeetingsLoading,
    isError: isMeetingsError,
    errorMessage: meetingsErrorMessage,
    fetchNextPage: loadMoreMeetings,
    hasNextPage: hasMoreMeetings,
    isFetchingNextPage: isFetchingMoreMeetings,
  } = useGroupMeetingsQuery({ groupId, limit: 20 }, { enabled: isOpen });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{data?.name ?? "Group summary"}</DialogTitle>
          <DialogDescription>
            {data?.description || "No description available."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Loading group summary...
          </p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Unable to load this group summary right now.
          </p>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-md border border-border/60 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Recurrence:</span>{" "}
                <span className="font-medium capitalize">
                  {data.recurrenceFrequency}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Start time:</span>{" "}
                <span className="font-medium">{data.startTime}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Duration:</span>{" "}
                <span className="font-medium">
                  {data.durationMinutes} minutes
                </span>
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Members</h3>
              {isMembersLoading && members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Loading members...
                </p>
              ) : isMembersError && members.length === 0 ? (
                <p className="text-sm text-destructive">
                  {membersErrorMessage ?? "Unable to load group members."}
                </p>
              ) : (
                <>
                  <GroupMembersList members={members} variant="compact" />
                  {hasMoreMembers && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void loadMoreMembers()}
                      disabled={isFetchingMoreMembers}
                    >
                      {isFetchingMoreMembers ? "Loading..." : "Load More"}
                    </Button>
                  )}
                </>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Meetings
              </h3>
              <GroupMeetingsSection
                meetings={meetings}
                isLoading={isMeetingsLoading}
                isError={isMeetingsError}
                errorMessage={meetingsErrorMessage}
                hasNextPage={hasMoreMeetings}
                isFetchingNextPage={isFetchingMoreMeetings}
                onLoadMore={() => void loadMoreMeetings()}
              />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
