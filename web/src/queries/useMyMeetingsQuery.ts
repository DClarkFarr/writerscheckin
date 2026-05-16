import { useMemo } from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { getMyMeetings } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import type {
  ListMemberMeetingsResponse,
  MemberMeetingFeedItem,
  MeetingSocketPayload,
} from "@/api/types/groups";

export type MyMeetingsQueryResponse = InfiniteData<
  ListMemberMeetingsResponse,
  unknown
>;
const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your meetings.";
  }

  return "Unable to load your meetings.";
};

export const myMeetingsQueryKey = () => ["my-meetings"] as const;

export interface ApplyMeetingSocketPayloadToMyMeetingsCacheInput {
  queryClient: QueryClient;
  payload: MeetingSocketPayload;
}

const defaultMeetingCounts = {
  attending: 0,
  reading: 0,
};

const isMeetingSocketPayload = (
  value: unknown,
): value is MeetingSocketPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<MeetingSocketPayload>;

  const hasValidAttendee =
    payload.meetingAttendee === null ||
    (typeof payload.meetingAttendee === "object" &&
      !!payload.meetingAttendee?.meetingId &&
      !!payload.meetingAttendee?.memberId);

  return Boolean(
    payload.groupMeeting?.meetingId &&
    payload.groupMeeting?.groupId &&
    payload.groupMember?.membershipId &&
    hasValidAttendee,
  );
};

export const mapMeetingSocketPayloadToFeedItem = (
  payload: MeetingSocketPayload,
  currentItem?: MemberMeetingFeedItem,
): MemberMeetingFeedItem => {
  return {
    meetingId: payload.groupMeeting.meetingId,
    groupId: payload.groupMeeting.groupId,
    name: payload.groupMeeting.name,
    occursAt: payload.groupMeeting.occursAt,
    description: payload.groupMeeting.description,
    address: payload.groupMeeting.address,
    startTime: payload.groupMeeting.startTime,
    durationMinutes: payload.groupMeeting.durationMinutes,
    publishEmailMessage: payload.groupMeeting.publishEmailMessage,
    attendanceEmailMessage: payload.groupMeeting.attendanceEmailMessage,
    publishHoursBefore: payload.groupMeeting.publishHoursBefore,
    notifyAttendanceHoursBefore:
      payload.groupMeeting.notifyAttendanceHoursBefore,
    ...(typeof payload.groupMeeting.endCheckinHoursBefore === "number"
      ? { endCheckinHoursBefore: payload.groupMeeting.endCheckinHoursBefore }
      : {}),
    ...(payload.groupMeeting.checkinClosesAt
      ? { checkinClosesAt: payload.groupMeeting.checkinClosesAt }
      : {}),
    ...(typeof payload.groupMeeting.isCheckinClosedByCuttoff === "boolean"
      ? {
          isCheckinClosedByCuttoff:
            payload.groupMeeting.isCheckinClosedByCuttoff,
        }
      : {}),
    ...(payload.groupMeeting.checkinPeriodMessage
      ? { checkinPeriodMessage: payload.groupMeeting.checkinPeriodMessage }
      : {}),
    status: payload.groupMeeting.status,
    membership: {
      membershipId: payload.groupMember.membershipId,
      userId: payload.groupMember.userId,
      email: payload.groupMember.email,
      role: payload.groupMember.role,
      status: payload.groupMember.status,
      createdAt: payload.groupMember.createdAt,
      invitedBy: payload.groupMember.invitedBy,
      invitedAt: payload.groupMember.invitedAt,
      acceptedAt: payload.groupMember.acceptedAt,
    },
    attendance: payload.meetingAttendee,
    counts: currentItem?.counts ?? defaultMeetingCounts,
    cancelledAt: payload.groupMeeting.cancelledAt ?? null,
  };
};

export const applyMeetingSocketPayloadToMyMeetingsCache = (
  input: ApplyMeetingSocketPayloadToMyMeetingsCacheInput,
) => {
  if (!isMeetingSocketPayload(input.payload)) {
    return;
  }

  const myMeetingsAllKey = myMeetingsQueryKey().slice(0, 1);
  const queries = input.queryClient
    .getQueriesData<MyMeetingsQueryResponse>({
      predicate: (query) => {
        return query.queryKey[0] === myMeetingsAllKey[0];
      },
    })
    .filter(([_, queryData]) => {
      return !!queryData;
    })
    .map(([queryKey, queryData]) => {
      const data = queryData as MyMeetingsQueryResponse;
      let hasExistingMeeting = false;
      let existingItem: MemberMeetingFeedItem | undefined;

      for (const page of data.pages) {
        const matchedItem = page.rows.find(
          (item) => item.meetingId === input.payload.groupMeeting.meetingId,
        );
        if (matchedItem) {
          hasExistingMeeting = true;
          existingItem = matchedItem;
          break;
        }
      }

      const mappedItem = mapMeetingSocketPayloadToFeedItem(
        input.payload,
        existingItem,
      );

      if (hasExistingMeeting) {
        const nextData: MyMeetingsQueryResponse = {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            rows: page.rows.map((item) =>
              item.meetingId === mappedItem.meetingId ? mappedItem : item,
            ),
          })),
        };

        return [queryKey, nextData] as const;
      }

      if (!data.pages.length) {
        return [queryKey, data] as const;
      }

      const firstPage = data.pages[0];
      const dedupedRows = [mappedItem, ...(firstPage.rows ?? [])].filter(
        (item, index, allRows) => {
          return (
            index ===
            allRows.findIndex(
              (candidate) => candidate.meetingId === item.meetingId,
            )
          );
        },
      );

      const nextData: MyMeetingsQueryResponse = {
        ...data,
        pages: [
          {
            ...firstPage,
            rows: dedupedRows,
          },
          ...data.pages.slice(1),
        ],
      };

      return [queryKey, nextData] as const;
    });

  queries.forEach(([queryKey, data]) => {
    input.queryClient.setQueryData(queryKey, data);
  });
};

const flattenMeetingPages = (
  pages: Array<{ rows: MemberMeetingFeedItem[] }>,
): MemberMeetingFeedItem[] => {
  const seenMeetingIds = new Set<string>();
  const mergedItems: MemberMeetingFeedItem[] = [];

  for (const page of pages) {
    for (const item of page.rows ?? []) {
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
