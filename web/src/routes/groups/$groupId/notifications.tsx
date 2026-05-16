import { createFileRoute } from "@tanstack/react-router";
import { GroupNotificationSettingsPage } from "../../../pages/group-notification-settings";

export const Route = createFileRoute("/groups/$groupId/notifications")({
  component: GroupNotificationSettingsRoute,
});

function GroupNotificationSettingsRoute() {
  const { groupId } = Route.useParams();

  return <GroupNotificationSettingsPage groupId={groupId} />;
}
