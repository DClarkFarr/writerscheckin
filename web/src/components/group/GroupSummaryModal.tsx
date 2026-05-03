import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { useGroupQuery } from "@/queries/use-group-query";

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
              <GroupMembersList members={data.members} variant="compact" />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
