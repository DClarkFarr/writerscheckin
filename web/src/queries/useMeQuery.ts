import { getMe } from "@/api/auth";
import { queryKeys } from "@/queries/queryKeys";
import type {
  BaseQueryOptions,
  RefetchBehaviorOptions,
} from "@/types/query.types";
import { useQuery } from "@tanstack/react-query";

export const meQueryKey = () => queryKeys.me();

export const useMeQuery = (
  { enabled }: BaseQueryOptions = {},
  { staleTimeMs = 5 * 60 * 1000, gcTimeMs }: RefetchBehaviorOptions = {},
) => {
  return useQuery({
    queryKey: meQueryKey(),
    queryFn: getMe,
    retry: false,
    staleTime: staleTimeMs,
    ...(typeof gcTimeMs === "number" ? { gcTime: gcTimeMs } : {}),
    enabled: enabled !== false,
  });
};

useMeQuery.key = meQueryKey;
