import { getGroupForm } from "@/api/groups";
import { queryKeys } from "@/queries/queryKeys";
import type { BaseQueryOptions } from "@/types/query.types";
import { useQuery } from "@tanstack/react-query";

export type UseGroupFormQueryProps = {
  groupId: string | undefined;
};

export const groupFormQueryKey = (groupId: string | undefined) =>
  queryKeys.groupForm(groupId);

export const useGroupFormQuery = (
  { groupId }: UseGroupFormQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: groupFormQueryKey(groupId),
    queryFn: () => getGroupForm(groupId ?? ""),
    enabled: enabled !== false && !!groupId,
  });
};

useGroupFormQuery.key = groupFormQueryKey;
