import { createGroup, updateGroup } from "@/api/groups";
import type { GroupFormDraft } from "@/api/types/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { queryKeys } from "@/queries/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UseSaveGroupMutationOptions = {
  mode: "create" | "edit";
  groupId?: string;
};

export const useSaveGroupMutation = ({
  mode,
  groupId,
}: UseSaveGroupMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: GroupFormDraft) => {
      if (mode === "edit") {
        if (!groupId) {
          throw new Error("Group ID is required.");
        }

        return updateGroup(groupId, values);
      }

      return createGroup(values);
    },
    onMutate: async (values) => {
      if (mode !== "edit" || !groupId) {
        return { snapshots: [] };
      }

      const snapshots = await cancelAndSnapshot(queryClient, [
        queryKeys.myGroups(),
        queryKeys.groupForm(groupId),
      ]);

      queryClient.setQueryData(
        queryKeys.groupForm(groupId),
        (current: unknown) => {
          if (!current || typeof current !== "object") {
            return current;
          }

          return {
            ...current,
            ...values,
            updatedAt: new Date().toISOString(),
          };
        },
      );

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
          items: Array<{ groupId: string; name: string }>;
          nextCursor: string | null;
        };

        return {
          ...typed,
          items: typed.items.map((item) =>
            item.groupId === groupId ? { ...item, name: values.name } : item,
          ),
        };
      });

      return { snapshots };
    },
    onError: (_error, _values, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (result) => {
      const resolvedGroupId = result?.groupId ?? groupId;

      await queryClient.invalidateQueries({ queryKey: queryKeys.myGroups() });

      if (resolvedGroupId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.groupForm(resolvedGroupId),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.groupById(resolvedGroupId),
        });
      }
    },
  });
};
