import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { getGroupMeetings } from "@/api/groups";
import type { GroupMeeting } from "@/api/types/groups";
import type { BaseQueryOptions } from "@/types/query.types";

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load group meetings.";
  }

  return "Unable to load group meetings.";
};

export type UseGroupMeetingsQueryProps = {
  groupId: string | undefined;
  limit?: number;
};

export const groupMeetingsQueryKey = (groupId: string | undefined) =>
  ["group-meetings", groupId] as const;

export const useGroupMeetingsQuery = (
  { groupId, limit }: UseGroupMeetingsQueryProps,
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
    queryKey: groupMeetingsQueryKey(groupId),
    queryFn: ({ pageParam }) =>
      getGroupMeetings({
        groupId: groupId ?? "",
        cursor:
          typeof pageParam === "string" && pageParam.length > 0
            ? pageParam
            : undefined,
        limit,
      }),
    enabled: enabled !== false && !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const meetings: GroupMeeting[] = data?.pages
    ? data.pages.flatMap((page) => page.rows ?? [])
    : [];

  const errorMessage = useMemo(
    () => (error ? mapErrorMessage(error) : null),
    [error],
  );

  return {
    meetings,
    isLoading,
    isError,
    errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

useGroupMeetingsQuery.key = groupMeetingsQueryKey;
