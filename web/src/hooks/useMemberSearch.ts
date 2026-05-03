import { useEffect, useRef, useState } from "react";
import type { MemberSearchResult } from "@/api/groups";
import { useMemberSearchQuery } from "@/queries/useMemberSearchQuery";

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

  const { data, isLoading, error } = useMemberSearchQuery(
    {
      query: debouncedQuery,
      groupId: options.groupId,
      limit: options.limit,
    },
    { enabled: hasQuery },
  );

  return {
    data,
    isLoading: hasQuery && isLoading,
    error,
    hasQuery,
  };
}
