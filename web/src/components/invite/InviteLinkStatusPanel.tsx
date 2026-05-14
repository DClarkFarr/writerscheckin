import type { InviteLinkAccessContext } from "@/api/types/groupInvites";
import { INVITE_LINK_STATUS_CONFIG } from "@/lib/inviteLinkStatusConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InviteLinkStatusPanelProps {
  context: InviteLinkAccessContext;
  onAcceptInvite?: () => void;
  onDeclineInvite?: () => void;
  onRequestToJoin?: () => void;
  isActionPending?: boolean;
}

export function InviteLinkStatusPanel({
  context,
  onAcceptInvite,
  onDeclineInvite,
  onRequestToJoin,
  isActionPending = false,
}: InviteLinkStatusPanelProps) {
  const config = INVITE_LINK_STATUS_CONFIG[context.accessState];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{context.groupName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {context.groupDescription}
        </p>
        <div className="space-y-1">
          <p className="text-sm font-medium">{config.title}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {context.availableActions.includes("accept_invite") &&
            onAcceptInvite && (
              <Button
                type="button"
                onClick={onAcceptInvite}
                disabled={isActionPending}
              >
                {isActionPending ? "Working..." : "Accept"}
              </Button>
            )}

          {context.availableActions.includes("decline_invite") &&
            onDeclineInvite && (
              <Button
                type="button"
                variant="outline"
                onClick={onDeclineInvite}
                disabled={isActionPending}
              >
                {isActionPending ? "Working..." : "Decline"}
              </Button>
            )}

          {context.availableActions.includes("request_to_join") &&
            onRequestToJoin && (
              <Button
                type="button"
                variant="outline"
                onClick={onRequestToJoin}
                disabled={isActionPending}
              >
                {isActionPending ? "Working..." : "Request to join"}
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
