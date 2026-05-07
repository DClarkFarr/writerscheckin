import { respondToGroupInvite } from "@/api/groups";
import type {
  GroupInviteAction,
  GroupSummaryItem,
  RespondToGroupInviteResponse,
} from "@/api/types/groups";
import { alert } from "@/utils/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAndSnapshot, rollbackSnapshot } from "./optimisticCache";
import { myGroupQueryKey } from "./useMyGroupsQuery";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";

interface RespondToGroupInviteVariables {
  membershipId: string;
  groupId: string;
  action: GroupInviteAction;
}

interface MyGroupsQueryPage {
  items: GroupSummaryItem[];
}

interface MyGroupsQueryCache {
  pages: MyGroupsQueryPage[];
  pageParams?: unknown[];
}

export const useRespondToGroupInviteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      action,
    }: RespondToGroupInviteVariables) => {
      return respondToGroupInvite(membershipId, { action });
    },
    onMutate: async ({ action, groupId }: RespondToGroupInviteVariables) => {
      const invitedKey = myGroupQueryKey("invited");
      const acceptedKey = myGroupQueryKey("accepted");
      const snapshots = await cancelAndSnapshot(queryClient, [
        invitedKey,
        acceptedKey,
      ]);

      let removedInvite: GroupSummaryItem | undefined;
      queryClient.setQueryData<MyGroupsQueryCache>(invitedKey, (old) => {
        if (!old?.pages) {
          return old;
        }

        return {
          ...old,
          pages: old.pages.map((page) => {
            const nextItems = (page.items ?? []).filter((item) => {
              const shouldRemove = item.groupId === groupId;
              if (shouldRemove) {
                removedInvite = item;
              }
              return !shouldRemove;
            });

            return {
              ...page,
              items: nextItems,
            };
          }),
        };
      });

      if (action === "accept") {
        queryClient.setQueryData<MyGroupsQueryCache>(acceptedKey, (old) => {
          if (!old?.pages || old.pages.length === 0 || !removedInvite) {
            return old as MyGroupsQueryCache;
          }

          const firstPage = old.pages[0];
          const firstPageItems = firstPage?.items ?? [];
          if (firstPageItems.some((item) => item.groupId === groupId)) {
            return old;
          }

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [removedInvite, ...firstPageItems],
              },
              ...old.pages.slice(1),
            ],
          };
        });
      }

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSuccess: (result: RespondToGroupInviteResponse) => {
      if (result.status === "accepted") {
        alert.success("Group invite accepted");
      } else {
        alert.success("Group invite declined");
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: myGroupQueryKey("invited"),
      });
      await queryClient.invalidateQueries({
        queryKey: myGroupQueryKey("accepted"),
      });
      await queryClient.invalidateQueries({
        queryKey: myMeetingsQueryKey(),
      });
    },
  });
};
