import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { getGroupMembers } from "@/api/groups";
import type { GroupFormMember, GroupMemberStatus } from "@/api/types/groups";
import type { BaseQueryOptions } from "@/types/query.types";

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load group members.";
  }

  return "Unable to load group members.";
};

export type UseGroupMembersQueryProps = {
  groupId: string | undefined;
  limit?: number;
  includeStatuses?: GroupMemberStatus[];
  excludeStatuses?: GroupMemberStatus[];
};

export const groupMembersQueryKey = (
  groupId: string | undefined,
  statusFilters?: {
    includeStatuses?: GroupMemberStatus[];
    excludeStatuses?: GroupMemberStatus[];
  },
) =>
  [
    "group-members",
    groupId,
    {
      includeStatuses: statusFilters?.includeStatuses ?? [],
      excludeStatuses: statusFilters?.excludeStatuses ?? [],
    },
  ] as const;

export const useGroupMembersQuery = (
  {
    groupId,
    limit,
    includeStatuses,
    excludeStatuses,
  }: UseGroupMembersQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: groupMembersQueryKey(groupId, {
      includeStatuses,
      excludeStatuses,
    }),
    queryFn: ({ pageParam }) =>
      getGroupMembers({
        groupId: groupId ?? "",
        cursor:
          typeof pageParam === "string" && pageParam.length > 0
            ? pageParam
            : undefined,
        limit,
        includeStatuses,
        excludeStatuses,
      }),
    enabled: enabled !== false && !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const members: GroupFormMember[] = data?.pages
    ? data.pages.flatMap((page) => page.rows ?? [])
    : [];

  const errorMessage = useMemo(
    () => (error ? mapErrorMessage(error) : null),
    [error],
  );

  return {
    members,
    isLoading,
    isError,
    errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

useGroupMembersQuery.key = groupMembersQueryKey;
