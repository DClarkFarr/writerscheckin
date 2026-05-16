import { getMyGroupNotificationSettings } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import { useQuery } from "@tanstack/react-query";

export type UseGroupNotificationSettingsQueryProps = {
  groupId: string | undefined;
};

export const groupNotificationSettingsQueryKey = (
  groupId: string | undefined,
) => {
  return ["group-notification-settings", groupId] as const;
};

export const useGroupNotificationSettingsQuery = (
  { groupId }: UseGroupNotificationSettingsQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: groupNotificationSettingsQueryKey(groupId),
    queryFn: () => getMyGroupNotificationSettings(groupId ?? ""),
    enabled: enabled !== false && !!groupId,
  });
};

useGroupNotificationSettingsQuery.key = groupNotificationSettingsQueryKey;
