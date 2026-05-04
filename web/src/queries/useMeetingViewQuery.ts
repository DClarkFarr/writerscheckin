import { useQuery } from "@tanstack/react-query";
import { getMeetingDetail } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import type { MeetingDetailResponse } from "@/api/types/groups";

export type UseMeetingViewQueryProps = {
  groupId: string | undefined;
  meetingId: string | undefined;
};

export const meetingViewQueryKey = (
  groupId: string | undefined,
  meetingId: string | undefined,
) => {
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
