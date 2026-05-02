import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface GroupCardActionsMenuProps {
  disabled?: boolean;
}

export function GroupCardActionsMenu({
  disabled = false,
}: GroupCardActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled}
        >
          ...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Edit Group</DropdownMenuItem>
        <DropdownMenuItem disabled>Activate Group</DropdownMenuItem>
        <DropdownMenuItem disabled>Deactivate Group</DropdownMenuItem>
        <DropdownMenuItem disabled>View Upcoming Meeting</DropdownMenuItem>
        <DropdownMenuItem disabled>Create Manual Meeting</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
