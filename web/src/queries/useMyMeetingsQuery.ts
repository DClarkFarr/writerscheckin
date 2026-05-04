import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { getMyMeetings } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import type { MyMeetingFeedItem } from "@/api/types/groups";

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your meetings.";
  }

  return "Unable to load your meetings.";
};

export const myMeetingsQueryKey = () => ["my-meetings"] as const;

const flattenMeetingPages = (
  pages: Array<{ items: MyMeetingFeedItem[] }>,
): MyMeetingFeedItem[] => {
  const seenMeetingIds = new Set<string>();
  const mergedItems: MyMeetingFeedItem[] = [];

  for (const page of pages) {
    for (const item of page.items ?? []) {
      if (!item?.meetingId || seenMeetingIds.has(item.meetingId)) {
        continue;
      }

      seenMeetingIds.add(item.meetingId);
      mergedItems.push(item);
    }
  }

  return mergedItems;
};

export const useMyMeetingsQuery = ({ enabled }: BaseQueryOptions = {}) => {
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
    queryKey: myMeetingsQueryKey(),
    queryFn: ({ pageParam }) =>
      getMyMeetings({
        cursor:
          typeof pageParam === "string" && pageParam.length > 0
            ? pageParam
            : undefined,
      }),
    enabled: enabled !== false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = data?.pages ? flattenMeetingPages(data.pages) : [];

  const errorMessage = useMemo(
    () => (error ? mapErrorMessage(error) : null),
    [error],
  );

  return {
    items,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    errorMessage,
    refetch,
  };
};

useMyMeetingsQuery.key = myMeetingsQueryKey;
