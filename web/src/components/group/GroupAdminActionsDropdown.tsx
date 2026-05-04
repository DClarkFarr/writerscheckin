import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { GroupSummaryItem } from "@/api/types/groups";
import { useCreateUpcomingMeetingMutation } from "@/queries/useCreateUpcomingMeetingMutation";
import { useNavigate } from "@tanstack/react-router";

export interface GroupAdminActionsMenuProps {
  group: GroupSummaryItem;
  hideViewLink?: boolean;
  disabled?: boolean;
}

export function GroupAdminActionsMenu({
  group: { groupId, availableActions, nextUpcomingMeeting },
  hideViewLink = false,
  disabled = false,
}: GroupAdminActionsMenuProps) {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateUpcomingMeetingMutation();
  const handleCreateMeeting = async () => {
    const result = await mutateAsync(groupId);
    navigate({
      to: "/groups/$groupId/meetings/$meetingId/edit",
      params: {
        groupId: result.groupId,
        meetingId: result.meetingId,
      },
    });
  };

  const createMeeting = () => {
    void handleCreateMeeting();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" disabled={disabled}>
          ...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Group Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!hideViewLink && (
          <DropdownMenuItem
            disabled={disabled}
            onSelect={() =>
              navigate({
                to: "/groups/$groupId/view",
                params: { groupId },
              })
            }
          >
            View Group
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={!availableActions.canActivate}>
          Activate Group
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!availableActions.canDeactivate}>
          Deactivate Group
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={
            disabled ||
            !availableActions.canViewUpcomingMeeting ||
            !nextUpcomingMeeting
          }
          onSelect={() => {
            if (!nextUpcomingMeeting) {
              return;
            }

            navigate({
              to: "/groups/$groupId/meetings/$meetingId/edit",
              params: {
                groupId,
                meetingId: nextUpcomingMeeting.meetingId,
              },
            });
          }}
        >
          View Upcoming Meeting
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled || isPending}
          onSelect={() => {
            createMeeting();
          }}
        >
          {isPending ? "Creating Meeting..." : "Create Next Meeting"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
