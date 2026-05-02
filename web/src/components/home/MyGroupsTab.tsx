import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import IconPlusBox from "~icons/mdi/plus-box";
import IconPencil from "~icons/mdi/pencil";
import IconEyeOutline from "~icons/mdi/eye-outline";
import { useMyGroupsQuery } from "@/hooks/useMyGroupsQuery";
import { useNavigate } from "@tanstack/react-router";
import { GroupRoleBadge } from "../group/GroupRoleBadge";
import { GroupMemberActionsDropdown } from "../group/GroupMemberActionsDropdown";
import { GroupSummaryModal } from "../group/GroupSummaryModal";
import { GroupAdminActionsMenu } from "../group/GroupAdminActionsDropdown";
import { formatDate } from "@/lib/dateFormat";

export function MyGroupsTab() {
  const navigate = useNavigate();
  const [summaryGroupId, setSummaryGroupId] = useState<string | null>(null);

  const { groups, isLoading, isError, errorMessage, refetch } =
    useMyGroupsQuery();

  const selectedGroup = useMemo(
    () => groups.find((group) => group.groupId === summaryGroupId) ?? null,
    [groups, summaryGroupId],
  );

  const hasGroups = groups.length > 0;

  const cards = groups.map((group) => (
    <Card key={group.groupId} size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>
            <GroupRoleBadge userRole={group.userRole} />
          </span>
          <span>{group.name}</span>
        </CardTitle>
        <CardAction>
          {group.userRole === "member" && (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  navigate({
                    to: "/groups/$groupId/view",
                    params: { groupId: group.groupId },
                  })
                }
              >
                <IconEyeOutline />
              </Button>
              <GroupMemberActionsDropdown group={group} />
            </>
          )}
          {group.userRole !== "member" && (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  navigate({
                    to: "/groups/$groupId/edit",
                    params: { groupId: group.groupId },
                  })
                }
              >
                <IconPencil />
              </Button>
              <GroupAdminActionsMenu group={group} />
            </>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1 text-xs text-muted-foreground">
        <p>
          Recurrence: <b className="text-gray-600">{group.recurrence}</b>
        </p>
        <p>
          Members: <b className="text-gray-600">{group.counts.activeMembers}</b>{" "}
          active /{" "}
          <b className="text-gray-600">{group.counts.invitedMembers}</b> invited
        </p>
        <p>
          Past meetings:{" "}
          <b className="text-gray-600">{group.counts.pastMeetings}</b>
        </p>
        <p>
          Next upcoming meeting:{" "}
          <b className="text-gray-600">
            {formatDate.full(group.nextUpcomingMeeting?.startsAt ?? null)}
          </b>
        </p>
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
      {selectedGroup && (
        <GroupSummaryModal
          groupId={selectedGroup.groupId}
          isOpen={Boolean(selectedGroup)}
          onClose={() => setSummaryGroupId(null)}
        />
      )}
    </div>
  );
}
