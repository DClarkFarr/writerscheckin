import { leaveGroup } from "@/api/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { groupFormQueryKey } from "@/queries/useGroupFormQuery";
import { groupQueryKey } from "@/queries/useGroupQuery";
import {
  myGroupQueryKey,
  type MyGroupsQueryResponse,
} from "@/queries/useMyGroupsQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => leaveGroup(groupId),
    onMutate: async (groupId) => {
      const snapshots = await cancelAndSnapshot(queryClient, [
        groupQueryKey(groupId),
        groupFormQueryKey(groupId),
      ]);

      queryClient.setQueriesData(
        {
          queryKey: myGroupQueryKey().slice(0, 1),
        },
        (current: MyGroupsQueryResponse) => {
          console.log("got current", current);
          if (
            !current ||
            typeof current !== "object" ||
            !("pages" in current) ||
            !Array.isArray(current.pages)
          ) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items?.filter((group) => group.groupId !== groupId),
            })),
          };
        },
      );

      queryClient.setQueryData(groupQueryKey(groupId), undefined);
      queryClient.setQueryData(groupFormQueryKey(groupId), undefined);

      return { snapshots };
    },
    onError: (_error, _groupId, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (_result, _error, groupId) => {
      await queryClient.invalidateQueries({
        queryKey: myGroupQueryKey().slice(0, 1),
      });
      await queryClient.invalidateQueries({
        queryKey: groupQueryKey(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: groupFormQueryKey(groupId),
      });
    },
  });
};
