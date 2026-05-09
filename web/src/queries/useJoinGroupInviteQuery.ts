import { useQuery } from "@tanstack/react-query";
import { getJoinGroupInvite } from "@/api/groupInvites";
import type { JoinGroupInviteResponse } from "@/api/types/groupInvites";
import type { BaseQueryOptions } from "@/types/query.types";

export const joinGroupInviteQueryKey = (
  membershipId: string,
  inviteToken: string,
) => ["join-group-invite", membershipId, inviteToken] as const;

interface UseJoinGroupInviteQueryInput {
  membershipId: string;
  inviteToken: string;
}

export const useJoinGroupInviteQuery = (
  { membershipId, inviteToken }: UseJoinGroupInviteQueryInput,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery<JoinGroupInviteResponse>({
    queryKey: joinGroupInviteQueryKey(membershipId, inviteToken),
    queryFn: () => getJoinGroupInvite(membershipId, inviteToken),
    enabled:
      enabled !== false &&
      membershipId.trim().length > 0 &&
      inviteToken.trim().length > 0,
    retry: false,
  });
};

useJoinGroupInviteQuery.key = joinGroupInviteQueryKey;
