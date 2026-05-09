import { createFileRoute } from "@tanstack/react-router";
import { JoinGroupInvitePage } from "../../pages/join-group-invite";

export const Route = createFileRoute("/_public/join/$membershipId")({
  component: JoinGroupInvitePage,
  validateSearch: (search) => {
    return {
      inviteToken: search?.inviteToken ? String(search.inviteToken) : "",
    };
  },
});
