import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "../../pages/login";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
  validateSearch: (search) => {
    return {
      redir: search?.redir ? String(search.redir) : undefined,
    };
  },
});
