import { createFileRoute } from "@tanstack/react-router";
import { GroupMeetingViewPage } from "../../../../../pages/group-meeting-view";

export const Route = createFileRoute(
  "/groups/$groupId/meetings/$meetingId/view",
)({
  component: GroupMeetingViewRoute,
});

function GroupMeetingViewRoute() {
  const { groupId, meetingId } = Route.useParams();

  return <GroupMeetingViewPage groupId={groupId} meetingId={meetingId} />;
}
