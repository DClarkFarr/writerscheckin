import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import IconPlusBox from "~icons/mdi/plus-box";
import { GroupCardActionsMenu } from "./GroupCardActionsMenu";
import { useMyGroupsQuery } from "@/hooks/useMyGroupsQuery";
import { useNavigate } from "@tanstack/react-router";

const formatMeetingDate = (value: string | null): string => {
  if (!value) {
    return "No upcoming meeting";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No upcoming meeting";
  }

  return date.toLocaleDateString();
};

export function MyGroupsTab() {
  const navigate = useNavigate();

  const { groups, isLoading, isError, errorMessage, refetch } =
    useMyGroupsQuery();

  const hasGroups = groups.length > 0;

  const cards = groups.map((group) => (
    <Card key={group.groupId} size="sm">
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardAction>
          <GroupCardActionsMenu
            groupId={group.groupId}
            availableActions={group.availableActions}
            nextUpcomingMeeting={group.nextUpcomingMeeting}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1 text-xs text-muted-foreground">
        <p>Recurrence: {group.recurrence}</p>
        <p>
          Members: {group.counts.activeMembers} active /{" "}
          {group.counts.invitedMembers} invited
        </p>
        <p>Past meetings: {group.counts.pastMeetings}</p>
        <p>
          Next upcoming meeting:{" "}
          {formatMeetingDate(group.nextUpcomingMeeting?.startsAt ?? null)}
        </p>
        <div className="pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              navigate({
                to: "/groups/$groupId/edit",
                params: { groupId: group.groupId },
              })
            }
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  ));

  const onClickCreate = useCallback(() => {
    navigate({ to: "/groups/create" });
  }, [navigate]);

  let content = <>{cards}</>;

  if (isError) {
    content = (
      <div className="flex flex-col gap-3 py-6">
        <p className="text-sm text-destructive" role="alert">
          {errorMessage ?? "Unable to load groups."}
        </p>
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  } else if (!hasGroups) {
    content = (
      <div className="py-6">
        <p className="text-sm text-muted-foreground">
          You are not in any groups yet. Create a new group to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-3">
      <div className="flex justify-end">
        <div>
          <Button type="button" onClick={onClickCreate}>
            <span>
              <IconPlusBox />
            </span>
            <span>Group</span>
          </Button>
        </div>
      </div>
      {isLoading && (
        <p className="py-6 text-sm text-muted-foreground">Loading groups...</p>
      )}
      {!isLoading && content}
    </div>
  );
}
