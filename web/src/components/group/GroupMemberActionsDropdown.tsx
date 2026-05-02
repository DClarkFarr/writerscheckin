import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconDotsVertical from "~icons/mdi/dots-vertical";
import IconLogoutVariant from "~icons/mdi/logout-variant";
import type { GroupSummaryItem } from "@/api/types/groups";
import { useGroupActions } from "@/hooks/useGroupActions";

export interface GroupMemberActionsDropdownProps {
  group: GroupSummaryItem;
}

export function GroupMemberActionsDropdown({
  group: { groupId },
}: GroupMemberActionsDropdownProps) {
  const { leaveGroup } = useGroupActions({
    onLeaveSuccess: () => {
      // TODO: what else?
    },
  });

  const onLeaveClick = () => {
    leaveGroup.mutate(groupId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Group actions"
        >
          <IconDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onLeaveClick}
          className="text-destructive focus:text-destructive"
        >
          <IconLogoutVariant className="mr-2" />
          Leave
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
