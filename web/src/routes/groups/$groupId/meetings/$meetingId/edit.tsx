import { createFileRoute } from "@tanstack/react-router";
import { GroupMeetingEditPage } from "../../../../../pages/group-meeting-edit";

export const Route = createFileRoute(
  "/groups/$groupId/meetings/$meetingId/edit",
)({
  component: GroupMeetingEditRoute,
});

function GroupMeetingEditRoute() {
  const { groupId, meetingId } = Route.useParams();

  return <GroupMeetingEditPage groupId={groupId} meetingId={meetingId} />;
}
