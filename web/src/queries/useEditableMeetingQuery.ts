import { useQuery } from "@tanstack/react-query";
import { getEditableMeeting } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";

export type UseEditableMeetingQueryProps = {
  groupId: string | undefined;
  meetingId: string | undefined;
};

export const editableMeetingQueryKey = (
  groupId: string | undefined,
  meetingId: string | undefined,
) => {
  return ["editableMeeting", groupId, meetingId] as const;
};

export const useEditableMeetingQuery = (
  { groupId, meetingId }: UseEditableMeetingQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: editableMeetingQueryKey(groupId, meetingId),
    queryFn: () => getEditableMeeting(groupId ?? "", meetingId ?? ""),
    enabled: enabled !== false && !!groupId && !!meetingId,
  });
};

useEditableMeetingQuery.key = editableMeetingQueryKey;
