import { normalizeGroupSummaryItem } from "@/api/groups";
import type { GroupSummaryItem } from "@/api/types/groups";
import {
  myGroupQueryKey,
  type MyGroupsQueryResponse,
} from "@/queries/useMyGroupsQuery";
import { useSocketStore } from "@/store/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type SubscribeSocketToGroupsCallbacks = {
  onChangeGroup?: (group: GroupSummaryItem) => void;
};
export const useSubscribeSocketToGroups = (
  incomingGroupIds: string[],
  { onChangeGroup }: SubscribeSocketToGroupsCallbacks = {},
) => {
  const { socket, activeGroupIds, setActiveGroupIds } = useSocketStore();

  useEffect(() => {
    if (
      JSON.stringify(activeGroupIds) !== JSON.stringify(incomingGroupIds) &&
      socket
    ) {
      const toSubscribe = incomingGroupIds.filter(
        (id) => !activeGroupIds.includes(id),
      );

      toSubscribe.forEach((groupId) => {
        socket?.emit("subscribe", { groupId });
      });

      const allGroupIds = Array.from(
        new Set([...activeGroupIds, ...incomingGroupIds]),
      );
      setActiveGroupIds(allGroupIds);
    }
  }, [incomingGroupIds, socket]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (socket) {
      socket.on("group", (data: GroupSummaryItem) => {
        const normalizedGroup = normalizeGroupSummaryItem(data);

        const myGroupsAllKey = myGroupQueryKey().slice(0, 1);

        const queries = queryClient
          .getQueriesData<MyGroupsQueryResponse>({
            predicate: (query) => {
              return query.queryKey[0] === myGroupsAllKey[0];
            },
          })
          .filter(([_, queryData]) => {
            return !!queryData;
          })
          .map(([queryKey, qd]) => {
            const queryData = qd as MyGroupsQueryResponse;

            let hasChangedGroup = false;
            const toSet = {
              ...queryData,
              pages: queryData.pages.map((page) => {
                return {
                  ...page,
                  items: page.items.map((item) => {
                    if (item.groupId === normalizedGroup.groupId) {
                      hasChangedGroup = true;
                      return normalizedGroup;
                    }
                    return item;
                  }),
                };
              }),
            };
            return [queryKey, hasChangedGroup ? toSet : queryData];
          });

        queries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(
            queryKey as ReturnType<typeof myGroupQueryKey>,
            data,
          );
        });

        onChangeGroup?.(normalizedGroup);
      });
    }

    return () => {
      if (socket) {
        socket.off("group");
      }
    };
  }, [socket]);
};

/// MyMeetingsQueryResponse
