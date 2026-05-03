import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { listMyGroups } from "@/api/groups";
import { queryKeys } from "@/queries/queryKeys";
import type { BaseQueryOptions } from "@/types/query.types";

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your groups.";
  }

  return "Unable to load your groups.";
};

export const myGroupQueryKey = () => queryKeys.myGroups();

export const useMyGroupsQuery = ({ enabled }: BaseQueryOptions = {}) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: myGroupQueryKey(),
    queryFn: () => listMyGroups(),
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
