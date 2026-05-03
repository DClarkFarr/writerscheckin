import { leaveGroup } from "@/api/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { queryKeys } from "@/queries/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onMutate: async (groupId) => {
      const snapshots = await cancelAndSnapshot(queryClient, [
        queryKeys.myGroups(),
        queryKeys.groupById(groupId),
        queryKeys.groupForm(groupId),
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
          items: Array<{ groupId: string }>;
          nextCursor: string | null;
        };

        return {
          ...typed,
          items: typed.items.filter((item) => item.groupId !== groupId),
        };
      });

      queryClient.setQueryData(queryKeys.groupById(groupId), undefined);
      queryClient.setQueryData(queryKeys.groupForm(groupId), undefined);

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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groupForm(groupId),
      });
    },
  });
};
