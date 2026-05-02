import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type {
  GroupSummaryAvailableActions,
  GroupSummaryUpcomingMeeting,
} from "@/api/types/groups";
import { createUpcomingMeeting } from "@/api/groups";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export interface GroupCardActionsMenuProps {
  groupId: string;
  availableActions: GroupSummaryAvailableActions;
  nextUpcomingMeeting: GroupSummaryUpcomingMeeting | null;
  disabled?: boolean;
}

export function GroupCardActionsMenu({
  groupId,
  availableActions,
  nextUpcomingMeeting,
  disabled = false,
}: GroupCardActionsMenuProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createMeetingMutation = useMutation({
    mutationFn: () => createUpcomingMeeting(groupId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      navigate({
        to: "/groups/$groupId/meetings/$meetingId/edit",
        params: {
          groupId: result.groupId,
          meetingId: result.meetingId,
        },
      });
    },
  });

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
        <DropdownMenuItem
          disabled={disabled}
          onSelect={() =>
            navigate({
              to: "/groups/$groupId/edit",
              params: { groupId },
            })
          }
        >
          Edit Group
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Activate Group</DropdownMenuItem>
        <DropdownMenuItem disabled>Deactivate Group</DropdownMenuItem>
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
          disabled={
            disabled ||
            !availableActions.canCreateManualMeeting ||
            createMeetingMutation.isPending
          }
          onSelect={() => {
            void createMeetingMutation.mutateAsync();
          }}
        >
          {createMeetingMutation.isPending
            ? "Creating Meeting..."
            : "Create Manual Meeting"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
