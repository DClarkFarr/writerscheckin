import { useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  timeout = 100,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current || 0);

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, timeout);
    },
    [callback, timeout],
  );

  return debouncedCallback;
};
