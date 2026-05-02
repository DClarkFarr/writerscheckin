import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveGroup } from "@/api/groups";
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

export interface UseGroupActionsResult {
  leaveGroup: {
    mutate: (groupId: string) => void;
    isPending: boolean;
    error: Error | null;
    isSuccess: boolean;
  };
}

export function useGroupActions(
  options: UseGroupActionsOptions = {},
): UseGroupActionsResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: async (_data, groupId) => {
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      await queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["my-groups"] });
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

  return {
    leaveGroup: {
      mutate: mutation.mutate,
      isPending: mutation.isPending,
      error:
        mutation.error instanceof Error
          ? mutation.error
          : mutation.error
            ? new Error(mapLeaveGroupError(mutation.error))
            : null,
      isSuccess: mutation.isSuccess,
    },
  };
}
