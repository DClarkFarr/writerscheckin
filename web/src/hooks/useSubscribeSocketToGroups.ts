import { normalizeGroupSummaryItem } from "@/api/groups";
import type {
  EditableGroupResponse,
  GroupRecurrenceFrequency,
  GroupSummaryItem,
} from "@/api/types/groups";
import { groupQueryKey } from "@/queries/useGroupQuery";
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

        console.log("got data", normalizedGroup, "from", data);

        applyMyGroupsQuery(queryClient, normalizedGroup);

        applyGroupQuery(queryClient, normalizedGroup);

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

const applyGroupQuery = (
  queryClient: ReturnType<typeof useQueryClient>,
  normalizedGroup: GroupSummaryItem,
) => {
  queryClient.setQueryData<EditableGroupResponse>(
    groupQueryKey(normalizedGroup.groupId),
    (oldData) => {
      if (!oldData) {
        return oldData;
      }

      return {
        ...oldData,
        recurrenceFrequency:
          normalizedGroup.recurrence as GroupRecurrenceFrequency,
        ...normalizedGroup,
      };
    },
  );
};

const applyMyGroupsQuery = (
  queryClient: ReturnType<typeof useQueryClient>,
  normalizedGroup: GroupSummaryItem,
) => {
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
};
