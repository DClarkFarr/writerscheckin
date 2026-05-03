import { useLeaveGroupMutation } from "@/queries/useLeaveGroupMutation";
import { ApiError } from "@/api/types";
import { alert } from "@/utils/alert";

function mapLeaveGroupError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "You must be logged in to leave a group.";
    if (error.status === 403)
      return "You don't have permission to perform this action.";
    if (error.status === 404) return "You are not a member of this group.";
    if (error.status === 409)
      return "Cannot leave a group without an accepted membership.";
    if (error.serverMessage) return error.serverMessage;
  }

  return "Unable to leave the group. Please try again.";
}

export interface UseGroupActionsOptions {
  onLeaveSuccess?: () => void;
  onLeaveError?: (error: Error) => void;
}

export function useGroupActions(options: UseGroupActionsOptions = {}) {
  const { mutateAsync, ...rest } = useLeaveGroupMutation();

  const leaveGroup = (groupId: string) => {
    mutateAsync(groupId, {
      onSuccess: () => {
        alert.success("You have left the group");
        options.onLeaveSuccess?.();
      },
      onError: (error) => {
        const message = mapLeaveGroupError(error);
        alert.error(message);
        options.onLeaveError?.(
          error instanceof Error ? error : new Error(message),
        );
      },
    });
  };

  return {
    leaveGroup,
    ...rest,
  };
}
