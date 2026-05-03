import { createUpcomingMeeting } from "@/api/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { queryKeys } from "@/queries/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateUpcomingMeetingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => createUpcomingMeeting(groupId),
    onMutate: async (groupId) => {
      const snapshots = await cancelAndSnapshot(queryClient, [
        queryKeys.myGroups(),
      ]);

      queryClient.setQueryData(queryKeys.myGroups(), (current: unknown) => {
        if (
          !current ||
          typeof current !== "object" ||
          !("items" in current) ||
          !Array.isArray((current as { items: unknown[] }).items)
        ) {
          return current;
        }

        const typed = current as {
          items: Array<{
            groupId: string;
            availableActions?: {
              canViewUpcomingMeeting?: boolean;
            };
          }>;
          nextCursor: string | null;
        };

        return {
          ...typed,
          items: typed.items.map((item) =>
            item.groupId === groupId
              ? {
                  ...item,
                  availableActions: {
                    ...item.availableActions,
                    canViewUpcomingMeeting: true,
                  },
                }
              : item,
          ),
        };
      });

      return { snapshots };
    },
    onError: (_error, _groupId, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (_result, _error, groupId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myGroups() });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groupById(groupId),
      });
    },
  });
};
