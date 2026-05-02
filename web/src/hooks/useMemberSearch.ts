import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMembers, type MemberSearchResult } from "@/api/groups";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export interface UseMemberSearchOptions {
  groupId?: string;
  limit?: number;
}

export interface UseMemberSearchResult {
  data: MemberSearchResult | undefined;
  isLoading: boolean;
  error: unknown;
  hasQuery: boolean;
}

export function useMemberSearch(
  query: string,
  options: UseMemberSearchOptions = {},
): UseMemberSearchResult {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);

    const handleTimeout = () => {
      if (query.length < MIN_QUERY_LENGTH) {
        setDebouncedQuery("");
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, DEBOUNCE_MS);
    };

    handleTimeout();

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isLoading, error } = useQuery({
    queryKey: ["members", "search", debouncedQuery, options.groupId],
    queryFn: () =>
      searchMembers(debouncedQuery, options.groupId, options.limit),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: hasQuery,
  });

  return {
    data,
    isLoading: hasQuery && isLoading,
    error,
    hasQuery,
  };
}
