import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import { listMyGroups } from "@/api/groups";
import type { GroupSummaryItem } from "@/api/types/groups";

const MY_GROUPS_QUERY_KEY = ["my-groups", "initial"] as const;

const mapErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to load your groups.";
  }

  return "Unable to load your groups.";
};

export interface UseMyGroupsQueryResult {
  groups: GroupSummaryItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => Promise<unknown>;
}

export const useMyGroupsQuery = (): UseMyGroupsQueryResult => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: MY_GROUPS_QUERY_KEY,
    queryFn: () => listMyGroups(),
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
