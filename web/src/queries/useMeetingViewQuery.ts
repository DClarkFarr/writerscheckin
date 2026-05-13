import { useQuery } from "@tanstack/react-query";
import { getMeetingDetail } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";

export type UseMeetingViewQueryProps = {
  groupId: string | undefined;
  meetingId: string | undefined;
};

export const meetingViewQueryKey = (
  groupId: string | undefined,
  meetingId: string | undefined,
) => {
  // Keep this key stable so check-in mutations can invalidate detail queries.
  return ["meetingView", groupId, meetingId] as const;
};

export const useMeetingViewQuery = (
  { groupId, meetingId }: UseMeetingViewQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: meetingViewQueryKey(groupId, meetingId),
    queryFn: () => getMeetingDetail(groupId ?? "", meetingId ?? ""),
    enabled: enabled !== false && !!groupId && !!meetingId,
  });
};

useMeetingViewQuery.key = meetingViewQueryKey;
