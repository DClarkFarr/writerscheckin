import { useQuery } from "@tanstack/react-query";
import { getMeetingDetail } from "@/api/groups";
import { ApiError } from "@/api/types";
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
  const query = useQuery({
    queryKey: meetingViewQueryKey(groupId, meetingId),
    queryFn: () => getMeetingDetail(groupId ?? "", meetingId ?? ""),
    enabled: enabled !== false && !!groupId && !!meetingId,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) {
        return false;
      }

      return failureCount < 3;
    },
  });

  return {
    ...query,
    inviteLinkContext: query.data?.inviteLinkContext ?? null,
  };
};

useMeetingViewQuery.key = meetingViewQueryKey;
