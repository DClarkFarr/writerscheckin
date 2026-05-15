import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMeetingCheckin } from "@/api/groups";
import { ApiError } from "@/api/types";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";
import { meetingViewQueryKey } from "./useMeetingViewQuery";
import type {
  MemberMeetingFeedItem,
  UpdateMeetingCheckinInput,
} from "@/api/types/groups";
import { getMemberMeetingAttendanceState } from "@/hooks/useMemberMeetingDerivedState";

interface UseMeetingCheckinMutationProps {
  meetingId: string;
  groupId?: string;
}

interface MyMeetingsQueryPage {
  rows: MemberMeetingFeedItem[];
}

interface MyMeetingsQueryCache {
  pages: MyMeetingsQueryPage[];
  pageParams?: unknown[];
}

interface OptimisticSnapshot {
  originalFeedItems: MemberMeetingFeedItem[] | undefined;
  feedItemBefore: MemberMeetingFeedItem | undefined;
}

const mapMeetingCheckinError = (error: unknown): Error => {
  if (error instanceof ApiError) {
    if (
      error.status === 409 &&
      /check-in period has ended/i.test(error.serverMessage)
    ) {
      return new Error("Check-in period has ended for this meeting.");
    }

    return new Error(error.serverMessage || "Unable to update check-in.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unable to update check-in.");
};

const createOptimisticFeedItem = (
  item: MemberMeetingFeedItem,
  newState: "attending" | "reading" | "not_attending",
): MemberMeetingFeedItem => {
  const stateOld = getMemberMeetingAttendanceState(item);
  let attendingCountDelta = 0;
  let readingCountDelta = 0;

  // Remove from old state
  if (stateOld === "attending") attendingCountDelta--;
  else if (stateOld === "reading") readingCountDelta--;

  // Add to new state
  if (newState === "attending") attendingCountDelta++;
  else if (newState === "reading") readingCountDelta++;

  const nextStatus = newState === "not_attending" ? "skipping" : newState;
  const nextTimestamp = new Date().toISOString();

  return {
    ...item,
    attendance: item.attendance
      ? {
          ...item.attendance,
          status: nextStatus,
          updatedAt: nextTimestamp,
        }
      : {
          meetingAttendeeId: `optimistic-${item.meetingId}`,
          meetingId: item.meetingId,
          memberId: item.membership.membershipId,
          status: nextStatus,
          createdAt: nextTimestamp,
          updatedAt: nextTimestamp,
        },
    counts: {
      attending: item.counts.attending + attendingCountDelta,
      reading: item.counts.reading + readingCountDelta,
    },
  };
};

export const useMeetingCheckinMutation = ({
  meetingId,
  groupId,
}: UseMeetingCheckinMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMeetingCheckinInput) => {
      try {
        return await updateMeetingCheckin(meetingId, input);
      } catch (error) {
        throw mapMeetingCheckinError(error);
      }
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
          .flatMap((page) => page.rows ?? [])
          .reduce((acc, item) => {
            if (!acc.has(item.meetingId)) {
              acc.set(item.meetingId, item);
            }
            return acc;
          }, new Map<string, MemberMeetingFeedItem>()) ?? new Map();

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
              rows: (page.rows ?? []).map((item: MemberMeetingFeedItem) =>
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
              rows: (page.rows ?? []).map((item: MemberMeetingFeedItem) => {
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
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: meetingViewQueryKey(groupId, meetingId),
        });
      }
    },
  });
};
