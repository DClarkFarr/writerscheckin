import { leaveGroup } from "@/api/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { groupFormQueryKey } from "@/queries/useGroupFormQuery";
import { groupQueryKey } from "@/queries/useGroupQuery";
import { myGroupQueryKey } from "@/queries/useMyGroupsQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onMutate: async (groupId) => {
      const snapshots = await cancelAndSnapshot(queryClient, [
        myGroupQueryKey(),
        groupQueryKey(groupId),
        groupFormQueryKey(groupId),
      ]);

      queryClient.setQueryData(myGroupQueryKey(), (current: unknown) => {
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

      queryClient.setQueryData(groupQueryKey(groupId), undefined);
      queryClient.setQueryData(groupFormQueryKey(groupId), undefined);

      return { snapshots };
    },
    onError: (_error, _groupId, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (_result, _error, groupId) => {
      await queryClient.invalidateQueries({ queryKey: myGroupQueryKey() });
      await queryClient.invalidateQueries({
        queryKey: groupQueryKey(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: groupFormQueryKey(groupId),
      });
    },
  });
};
