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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{invite.groupName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{statusText[invite.status]}</p>
        {invite.address ? <p>Address: {invite.address}</p> : null}
        {invite.nextMeetingStartsAt ? (
          <p>Next meeting: {formatDate.dateTime(invite.nextMeetingStartsAt)}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
