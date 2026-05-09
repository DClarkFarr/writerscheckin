import type { JoinGroupInviteResponse } from "@/api/types/groupInvites";
import { formatDate } from "@/lib/dateFormat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinGroupInviteCardProps {
  invite: JoinGroupInviteResponse;
}

const statusText: Record<JoinGroupInviteResponse["status"], string> = {
  pending: "Invitation is pending.",
  accepted: "You have already joined this group.",
  declined: "You have declined this invitation.",
  expired: "This invitation is no longer active.",
  invalid: "This invitation link is invalid.",
};

export function JoinGroupInviteCard({ invite }: JoinGroupInviteCardProps) {
  return (
    <>
      <h1 className="text-theme-900 text-lg font-semibold mb-6">
        Join Your Next Writing Group
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{invite.groupName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Organized by: <b>{invite.groupOwnerName || "N/A"}</b>
          </p>

          <p className="text-gray-800 text-base">{invite.meetingRecurrence}</p>

          <p>
            Address: <b>{invite.address || "N/A"}</b>
          </p>
          <p>
            {invite.nextMeetingStartsAt ? (
              <>
                Next meeting {formatDate.dateTime(invite.nextMeetingStartsAt)}
              </>
            ) : null}
          </p>

          <p>{statusText[invite.status]}</p>

          {invite.status === "pending" && <div>buttons here</div>}
        </CardContent>
      </Card>
    </>
  );
}
