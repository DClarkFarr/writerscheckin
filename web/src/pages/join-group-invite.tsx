import { PageCard } from "@/components/layout/PageCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams, useSearch } from "@tanstack/react-router";
import { JoinGroupInviteCard } from "@/components/invite/JoinGroupInviteCard";
import { useJoinGroupInviteQuery } from "@/queries/useJoinGroupInviteQuery";

export function JoinGroupInvitePage() {
  const params = useParams({
    from: "/_public/join/$membershipId",
  });
  const search = useSearch({
    from: "/_public/join/$membershipId",
  });

  const { data, isLoading, error } = useJoinGroupInviteQuery({
    membershipId: params.membershipId,
    inviteToken: search.inviteToken,
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
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
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
    <PageCard>{data ? <JoinGroupInviteCard invite={data} /> : null}</PageCard>
  );
}
