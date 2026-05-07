import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dateFormat";
import type {
  GroupInviteAction,
  RespondToGroupInviteResponse,
} from "@/api/types/groups";
import type { GroupInviteViewModel } from "@/hooks/useGroupInvites";
import IconCheck from "~icons/mdi/check";
import IconClose from "~icons/mdi/close";

interface GroupInviteListItemProps {
  invite: GroupInviteViewModel;
  isPending?: boolean;
  onAction: (
    membershipId: string,
    groupId: string,
    action: GroupInviteAction,
  ) => Promise<RespondToGroupInviteResponse>;
}

export function GroupInviteListItem({
  invite,
  isPending,
  onAction,
}: GroupInviteListItemProps) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <div className="flex gap-3 ">
        <div className="space-y-1 grow">
          <p className="text-sm font-medium text-foreground">
            {invite.groupName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink">
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-500"
            disabled={Boolean(isPending)}
            onClick={() =>
              void onAction(invite.membershipId, invite.groupId, "accept")
            }
          >
            <span>
              <IconCheck />
            </span>
            <span>Join Group</span>
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-red-600 text-white hover:bg-red-500"
            disabled={Boolean(isPending)}
            onClick={() =>
              void onAction(invite.membershipId, invite.groupId, "decline")
            }
          >
            <span>
              <IconClose />
            </span>
            <span>Decline</span>
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Address:{" "}
          {invite.address.trim().length > 0 ? invite.address : "Unspecified"}
        </p>
        <p className="text-xs text-muted-foreground">
          Meeting time:{" "}
          {invite.meetingStartsAt
            ? formatDate.full(invite.meetingStartsAt, "Unscheduled")
            : "Unscheduled"}
        </p>
      </div>
    </div>
  );
}
