import { updateMyGroupNotificationSettings } from "@/api/groups";
import type {
  GroupMemberNotificationSettingsResponse,
  GroupMemberUnsubscribedNotifications,
  GroupNotificationType,
} from "@/api/types/groups";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupNotificationSettingsQueryKey } from "./useGroupNotificationSettingsQuery";

export interface UpdateGroupNotificationSettingInput {
  notificationType: GroupNotificationType;
  unsubscribed: boolean;
}

interface UseGroupNotificationSettingsMutationProps {
  groupId: string;
}

const applyOptimisticUpdate = (
  current: GroupMemberNotificationSettingsResponse,
  input: UpdateGroupNotificationSettingInput,
): GroupMemberNotificationSettingsResponse => {
  const nextMap: GroupMemberUnsubscribedNotifications = {
    ...(current.unsubscribedNotifications ?? {}),
  };

  nextMap[input.notificationType] = input.unsubscribed;

  return {
    ...current,
    unsubscribedNotifications: nextMap,
    updatedAt: new Date().toISOString(),
  };
};

export const useGroupNotificationSettingsMutation = ({
  groupId,
}: UseGroupNotificationSettingsMutationProps) => {
  const queryClient = useQueryClient();
  const key = groupNotificationSettingsQueryKey(groupId);

  return useMutation({
    mutationFn: (input: UpdateGroupNotificationSettingInput) =>
      updateMyGroupNotificationSettings(groupId, input),
    onMutate: async (input) => {
      const snapshots = await cancelAndSnapshot(queryClient, [key]);

      queryClient.setQueryData<GroupMemberNotificationSettingsResponse>(
        key,
        (current) => {
          if (!current) {
            return current;
          }

          return applyOptimisticUpdate(current, input);
        },
      );

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
