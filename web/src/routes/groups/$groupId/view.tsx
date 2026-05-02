import { createFileRoute } from "@tanstack/react-router";
import { GroupViewPage } from "../../../pages/group-view";

export const Route = createFileRoute("/groups/$groupId/view")({
  component: GroupViewPage,
});
