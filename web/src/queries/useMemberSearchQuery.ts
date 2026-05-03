import { searchMembers } from "@/api/groups";
import { queryKeys } from "@/queries/queryKeys";
import type {
  BaseQueryOptions,
  RefetchBehaviorOptions,
} from "@/types/query.types";
import { useQuery } from "@tanstack/react-query";

export type UseMemberSearchQueryProps = {
  query: string;
  groupId?: string;
  limit?: number;
};

export const memberSearchQueryKey = (query: string, groupId?: string) =>
  queryKeys.memberSearch(query, groupId);

export const useMemberSearchQuery = (
  { query, groupId, limit }: UseMemberSearchQueryProps,
  { enabled }: BaseQueryOptions = {},
  {
    staleTimeMs = 5 * 60_000,
    gcTimeMs = 10 * 60_000,
  }: RefetchBehaviorOptions = {},
) => {
  return useQuery({
    queryKey: memberSearchQueryKey(query, groupId),
    queryFn: () => searchMembers(query, groupId, limit),
    staleTime: staleTimeMs,
    gcTime: gcTimeMs,
    enabled: enabled !== false && query.length >= 2,
  });
};

useMemberSearchQuery.key = memberSearchQueryKey;
