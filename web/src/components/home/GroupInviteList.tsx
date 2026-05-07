import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  GroupInviteAction,
  RespondToGroupInviteResponse,
} from "@/api/types/groups";
import type { GroupInviteViewModel } from "@/hooks/useGroupInvites";
import { GroupInviteListItem } from "./GroupInviteListItem";

interface GroupInviteListProps {
  invites: GroupInviteViewModel[];
  isPendingAction?: boolean;
  actionError?: string | null;
  onAction: (
    membershipId: string,
    groupId: string,
    action: GroupInviteAction,
  ) => Promise<RespondToGroupInviteResponse>;
}

export function GroupInviteList({
  invites,
  isPendingAction,
  actionError,
  onAction,
}: GroupInviteListProps) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <Card size="sm" className="border-2 border-orange-500">
      <CardHeader>
        <CardTitle className="text-base">Waiting Group Invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionError ? (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}
        {invites.map((invite) => (
          <GroupInviteListItem
            key={invite.membershipId}
            invite={invite}
            isPending={isPendingAction}
            onAction={onAction}
          />
        ))}
      </CardContent>
    </Card>
  );
}
