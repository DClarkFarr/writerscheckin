import { getGroupById } from "@/api/groups";
import { queryKeys } from "@/queries/queryKeys";
import type { BaseQueryOptions } from "@/types/query.types";
import { useQuery } from "@tanstack/react-query";

export type UseGroupQueryProps = {
  groupId: string | undefined;
};
export const groupQueryKey = (groupId: string | undefined) =>
  queryKeys.groupById(groupId);

export const useGroupQuery = (
  { groupId }: UseGroupQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: groupQueryKey(groupId),
    queryFn: () => getGroupById(groupId ?? ""),
    enabled: enabled !== false && !!groupId,
  });
};

useGroupQuery.key = groupQueryKey;
