import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMeetingCheckin } from "@/api/groups";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";
import type {
  MyMeetingFeedItem,
  UpdateMeetingCheckinInput,
} from "@/api/types/groups";

interface UseMeetingCheckinMutationProps {
  meetingId: string;
}

interface MyMeetingsQueryPage {
  items: MyMeetingFeedItem[];
}

interface MyMeetingsQueryCache {
  pages: MyMeetingsQueryPage[];
  pageParams?: unknown[];
}

interface OptimisticSnapshot {
  originalFeedItems: MyMeetingFeedItem[] | undefined;
  feedItemBefore: MyMeetingFeedItem | undefined;
}

const createOptimisticFeedItem = (
  item: MyMeetingFeedItem,
  newState: "attending" | "reading" | "not_attending",
): MyMeetingFeedItem => {
  const stateOld = item.userCheckinState;
  let attendingCountDelta = 0;
  let readingCountDelta = 0;

  // Remove from old state
  if (stateOld === "attending") attendingCountDelta--;
  else if (stateOld === "reading") readingCountDelta--;

  // Add to new state
  if (newState === "attending") attendingCountDelta++;
  else if (newState === "reading") readingCountDelta++;

  return {
    ...item,
    userCheckinState: newState,
    attendingCount: item.attendingCount + attendingCountDelta,
    readingCount: item.readingCount + readingCountDelta,
  };
};

export const useMeetingCheckinMutation = ({
  meetingId,
}: UseMeetingCheckinMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMeetingCheckinInput) => {
      return updateMeetingCheckin(meetingId, input);
    },
    onMutate: async (input: UpdateMeetingCheckinInput) => {
      // Cancel outgoing refetches to prevent race condition
      await queryClient.cancelQueries({ queryKey: myMeetingsQueryKey() });

      // Get current feed items
      const queryKey = myMeetingsQueryKey();
      const previousData =
        queryClient.getQueryData<MyMeetingsQueryCache>(queryKey);

      // Flatten items to find target meeting
      const allItems =
        previousData?.pages
          .flatMap((page) => page.items ?? [])
          .reduce((acc, item) => {
            if (!acc.has(item.meetingId)) {
              acc.set(item.meetingId, item);
            }
            return acc;
          }, new Map<string, MyMeetingFeedItem>()) ?? new Map();

      const feedItemBefore = allItems.get(meetingId);

      // Create snapshot for rollback
      const snapshot: OptimisticSnapshot = {
        originalFeedItems: Array.from(allItems.values()),
        feedItemBefore,
      };

      // Optimistically update the feed
      if (feedItemBefore) {
        const optimisticItem = createOptimisticFeedItem(
          feedItemBefore,
          input.state,
        );

        queryClient.setQueryData<MyMeetingsQueryCache>(queryKey, (old) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: (page.items ?? []).map((item: MyMeetingFeedItem) =>
                item.meetingId === meetingId ? optimisticItem : item,
              ),
            })),
          };
        });
      }

      return snapshot;
    },
    onError: (
      _error: unknown,
      _variables: UpdateMeetingCheckinInput,
      context,
    ) => {
      if (!context || !context.originalFeedItems) return;

      // Rollback to previous state
      const snapshot = context as OptimisticSnapshot;
      queryClient.setQueryData<MyMeetingsQueryCache>(
        myMeetingsQueryKey(),
        (old) => {
          if (!old?.pages) return old;

          const itemMap = new Map(
            snapshot.originalFeedItems?.map((item) => [item.meetingId, item]),
          );

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: (page.items ?? []).map((item: MyMeetingFeedItem) => {
                const original = itemMap.get(item.meetingId);
                return original ?? item;
              }),
            })),
          };
        },
      );
    },
    onSettled: () => {
      // Refetch to ensure canonical state
      queryClient.invalidateQueries({ queryKey: myMeetingsQueryKey() });
    },
  });
};
