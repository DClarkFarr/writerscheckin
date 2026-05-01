import { useCallback, useEffect, useRef } from "react";

export type UseClickOutsideProps = {
  onClickOutside: () => void;
};
export const useClickOutside = <T extends HTMLElement>({
  onClickOutside,
}: UseClickOutsideProps) => {
  const containerRef = useRef<T>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    },
    [onClickOutside],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return { containerRef };
};
