import { useMemo } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { listMyGroups } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import type {
  GroupMemberStatus,
  GroupSummaryItem,
  ListMyGroupsResponse,
} from "@/api/types/groups";

export type MyGroupsQueryResponse = InfiniteData<ListMyGroupsResponse, unknown>;

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your groups.";
  }

  return "Unable to load your groups.";
};

export const myGroupQueryKey = (status?: string) =>
  ["my-groups", status ?? "all"] as const;

type UseMyGroupsQueryProps = {
  status?: GroupMemberStatus;
};

const flattenGroupPages = (
  pages: Array<{ items: GroupSummaryItem[] }>,
): GroupSummaryItem[] => pages.flatMap((page) => page.items ?? []);

export const useMyGroupsQuery = (
  { status }: UseMyGroupsQueryProps,
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
    queryKey: myGroupQueryKey(status),
    queryFn: ({ pageParam }) =>
      listMyGroups({
        status,
        cursor:
          typeof pageParam === "string" && pageParam.length > 0
            ? pageParam
            : undefined,
      }),
    enabled: enabled !== false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const groups = data?.pages ? flattenGroupPages(data.pages) : [];

  const errorMessage = useMemo(
    () => (error ? mapErrorMessage(error) : null),
    [error],
  );

  return {
    groups,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    errorMessage,
    refetch,
  };
};

useMyGroupsQuery.key = myGroupQueryKey;
