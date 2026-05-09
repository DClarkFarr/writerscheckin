import { PageCard } from "@/components/layout/PageCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams, useSearch } from "@tanstack/react-router";
import { JoinGroupInviteCard } from "@/components/invite/JoinGroupInviteCard";
import { useJoinGroupInviteQuery } from "@/queries/useJoinGroupInviteQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

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
    <PageCard>{data ? <JoinGroupInviteCard invite={data} /> : null}</PageCard>
  );
}
