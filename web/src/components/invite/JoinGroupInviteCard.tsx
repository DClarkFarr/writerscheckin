import type { JoinGroupInviteResponse } from "@/api/types/groupInvites";
import { formatDate } from "@/lib/dateFormat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IconCheck from "~icons/mdi/check";
import IconCancel from "~icons/mdi/cancel";

interface JoinGroupInviteCardProps {
  invite: JoinGroupInviteResponse;
  onAccept?: () => void;
  onDecline?: () => void;
  isActionPending?: boolean;
}

const statusText: Record<JoinGroupInviteResponse["status"], string> = {
  pending: "Invitation is pending. You can join or decline below.",
  accepted: "You have already joined this group.",
  declined: "You have declined this invitation.",
  expired: "This invitation is no longer active.",
  invalid: "This invitation link is invalid.",
};

export function JoinGroupInviteCard({
  invite,
  onAccept,
  onDecline,
  isActionPending = false,
}: JoinGroupInviteCardProps) {
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
          <p className="text-gray-800 text-base">
            {invite.meetingRecurrence || "N/A"}
          </p>
          <p>
            Organized by: <b>{invite.groupOwnerName || "N/A"}</b>
          </p>

          <p>
            Address: <b>{invite.address || "N/A"}</b>
          </p>
          <p>
            Next meeting:{" "}
            <b>
              {invite.nextMeetingStartsAt
                ? formatDate.dateTime(invite.nextMeetingStartsAt)
                : "N/A"}
            </b>
          </p>

          <p>{statusText[invite.status]}</p>

          {invite.status === "pending" && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onAccept}
                disabled={isActionPending || !invite.canAccept}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <IconCheck />
                {isActionPending ? "Working..." : "Join Group"}
              </Button>
              <Button
                onClick={onDecline}
                disabled={isActionPending || !invite.canDecline}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <IconCancel />
                {isActionPending ? "Working..." : "Decline"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
