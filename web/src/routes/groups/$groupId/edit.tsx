import { createFileRoute } from "@tanstack/react-router";
import { GroupEditPage } from "../../../pages/group-edit";

export const Route = createFileRoute("/groups/$groupId/edit")({
  component: GroupEditRoute,
});

function GroupEditRoute() {
  const { groupId } = Route.useParams();

  return <GroupEditPage groupId={groupId} />;
}
