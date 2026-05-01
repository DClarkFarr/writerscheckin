import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { getMe } from "../../api/auth";
import { ApiError } from "../../api/types";

export function RootLayout() {
  const { setUser, clearUser } = useAuthStore();

  const { data, isSuccess, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isSuccess && data) {
      setUser(data);
    }
  }, [isSuccess, data, setUser]);

  useEffect(() => {
    if (error instanceof ApiError) {
      if (error.serverMessage !== "Network Error") {
        console.warn(
          "clearing user",
          error.serverMessage,
          error.status,
          error.stack,
        );
        clearUser();
      }
    }
  }, [error, clearUser]);

  return <Outlet />;
}
