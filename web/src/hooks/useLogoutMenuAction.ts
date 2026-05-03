import { useCallback } from "react";
import { ApiError } from "@/api/types";
import { useLogoutMutation } from "@/queries/useLogoutMutation";
import { useAuthStore } from "@/store/authStore";

function mapLogoutError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return "Too many attempts. Please try again shortly.";
    if (error.serverMessage) return error.serverMessage;
  }

  return "Unable to log out right now. Please try again.";
}

export interface UseLogoutMenuActionResult {
  handleLogout: () => Promise<void>;
  isPending: boolean;
  errorMessage: string | null;
}

export function useLogoutMenuAction(): UseLogoutMenuActionResult {
  const clearUser = useAuthStore((state) => state.clearUser);

  const { mutateAsync, isPending, error, reset } = useLogoutMutation();

  const handleLogout = useCallback(async () => {
    reset();

    try {
      await mutateAsync();
      clearUser();
    } catch {
      // Error text is exposed via errorMessage; no throw to keep menu interaction stable.
    }
  }, [clearUser, mutateAsync, reset]);

  return {
    handleLogout,
    isPending,
    errorMessage: error ? mapLogoutError(error) : null,
  };
}
