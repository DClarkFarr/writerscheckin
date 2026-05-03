import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ApiError } from "@/api/types";
import { useMeQuery } from "@/queries/useMeQuery";
import { useAuthStore } from "@/store/authStore";
import { Topbar } from "./Topbar";

export function RootLayout() {
  const { setUser, clearUser } = useAuthStore();

  const navigate = useNavigate();

  const { data, isSuccess, error, isLoading } = useMeQuery();

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

  useEffect(() => {
    if (!data && !isLoading) {
      navigate({
        to: "/",
      });
    }
  }, [data, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-theme-950">
      <div className="shrink-0">
        <Topbar />
      </div>
      <div className="grow-1 flex flex-col items-center justify-center mx-auto bg-theme-950 px-4 w-full max-w-lg">
        <Outlet />
      </div>
    </div>
  );
}
