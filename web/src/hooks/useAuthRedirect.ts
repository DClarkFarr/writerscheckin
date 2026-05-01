import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "@tanstack/react-router";

export const useAuthRedirect = () => {
  const { user, isLoaded } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user === null) {
      navigate({
        to: "/login",
        search: {
          redir: window.location.pathname, // Preserve the intended destination for post-login redirection
        },
      });
    }
  }, [isLoaded, user]);
};
