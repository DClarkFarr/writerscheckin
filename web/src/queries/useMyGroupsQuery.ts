import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { listMyGroups } from "@/api/groups";
import type { BaseQueryOptions } from "@/types/query.types";
import type { GroupMemberStatus } from "@/api/types/groups";

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your groups.";
  }

  return "Unable to load your groups.";
};

export const myGroupQueryKey = (status: string | undefined) =>
  ["my-groups", status] as const;

type UseMyGroupsQueryProps = {
  status?: GroupMemberStatus;
};
export const useMyGroupsQuery = (
  { status }: UseMyGroupsQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: myGroupQueryKey(status),
    queryFn: () => listMyGroups({ status }),
    enabled: enabled !== false,
  });

  const groups = data?.items ?? [];

  const errorMessage = useMemo(
    () => (error ? mapErrorMessage(error) : null),
    [error],
  );

  return {
    groups,
    isLoading,
    isError,
    errorMessage,
    refetch,
  };
};

useMyGroupsQuery.key = myGroupQueryKey;
