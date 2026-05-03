import { removeGroupMember, updateGroupMemberRole } from "@/api/groups";
import type { GroupMemberRole } from "@/api/types/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { groupFormQueryKey } from "@/queries/useGroupFormQuery";
import { myGroupQueryKey } from "@/queries/useMyGroupsQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateRoleInput = {
  groupId: string;
  memberId: string;
  role: GroupMemberRole;
};

type RemoveMemberInput = {
  groupId: string;
  memberId: string;
};

export const useGroupMemberMutations = () => {
  const queryClient = useQueryClient();

  const updateMemberRole = useMutation({
    mutationFn: ({ groupId, memberId, role }: UpdateRoleInput) =>
      updateGroupMemberRole(groupId, memberId, role),
    onMutate: async ({ groupId, memberId, role }) => {
      const key = groupFormQueryKey(groupId);
      const snapshots = await cancelAndSnapshot(queryClient, [key]);

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current;
        }

        const typed = current as {
          members?: Array<{
            _id?: string;
            identifier: string;
            role: GroupMemberRole;
          }>;
        };

        if (!Array.isArray(typed.members)) {
          return typed;
        }

        return {
          ...typed,
          members: typed.members.map((member) =>
            (member._id ?? member.identifier) === memberId
              ? { ...member, role }
              : member,
          ),
        };
      });

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (_result, _error, { groupId }) => {
      await queryClient.invalidateQueries({
        queryKey: groupFormQueryKey(groupId),
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: ({ groupId, memberId }: RemoveMemberInput) =>
      removeGroupMember(groupId, memberId),
    onMutate: async ({ groupId, memberId }) => {
      const key = groupFormQueryKey(groupId);
      const snapshots = await cancelAndSnapshot(queryClient, [key]);

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current;
        }

        const typed = current as {
          members?: Array<{ _id?: string; identifier: string }>;
        };

        if (!Array.isArray(typed.members)) {
          return typed;
        }

        return {
          ...typed,
          members: typed.members.filter(
            (member) => (member._id ?? member.identifier) !== memberId,
          ),
        };
      });

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async (_result, _error, { groupId }) => {
      await queryClient.invalidateQueries({
        queryKey: groupFormQueryKey(groupId),
      });
      await queryClient.invalidateQueries({ queryKey: myGroupQueryKey() });
    },
  });

  return { updateMemberRole, removeMember };
};
