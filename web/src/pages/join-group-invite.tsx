import { PageCard } from "@/components/layout/PageCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams, useSearch } from "@tanstack/react-router";
import { JoinGroupInviteCard } from "@/components/invite/JoinGroupInviteCard";
import { useJoinGroupInviteQuery } from "@/queries/useJoinGroupInviteQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useJoinGroupInvite } from "@/hooks/useJoinGroupInvite";
import { InviteDeclineConfirmDialog } from "@/components/invite/InviteDeclineConfirmDialog";
import { JoinInviteLoginDialog } from "@/components/invite/JoinInviteLoginDialog";

export function JoinGroupInvitePage() {
  const params = useParams({
    from: "/_public/join/$membershipId",
  });
  const search = useSearch({
    from: "/_public/join/$membershipId",
  });
  const inviteToken = search.inviteToken || "";

  const { data, isLoading, error } = useJoinGroupInviteQuery({
    membershipId: params.membershipId,
    inviteToken,
  });

  const joinInvite = useJoinGroupInvite({
    membershipId: params.membershipId,
    inviteToken,
    canAccept: data?.canAccept ?? false,
    canDecline: data?.canDecline ?? false,
  });

  if (!search.inviteToken) {
    return (
      <PageCard>
        <Alert variant="destructive">
          <AlertDescription>
            This invite link is missing a token.
          </AlertDescription>
        </Alert>
      </PageCard>
    );
  }

  if (isLoading) {
    return (
      <PageCard>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Join Your Next Writing Group
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </CardContent>
        </Card>
      </PageCard>
    );
  }

  if (error instanceof Error) {
    return (
      <PageCard>
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </PageCard>
    );
  }

  return (
    <PageCard>
      {data ? (
        <>
          {joinInvite.respondError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{joinInvite.respondError}</AlertDescription>
            </Alert>
          ) : null}
          <JoinGroupInviteCard
            invite={data}
            onAccept={joinInvite.onAccept}
            onDecline={joinInvite.onDecline}
            isActionPending={joinInvite.isResponding}
          />
          <InviteDeclineConfirmDialog
            open={joinInvite.isDeclineDialogOpen}
            onOpenChange={joinInvite.onDeclineDialogOpenChange}
            onConfirm={joinInvite.onConfirmDecline}
            isPending={joinInvite.isResponding}
          />
          <JoinInviteLoginDialog
            open={joinInvite.isLoginDialogOpen}
            onOpenChange={joinInvite.onLoginDialogOpenChange}
            onLoginSuccess={joinInvite.onLoginSuccess}
          />
        </>
      ) : null}
    </PageCard>
  );
}
