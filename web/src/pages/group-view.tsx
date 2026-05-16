import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import IconPencil from "~icons/mdi/pencil";
import { PageCard } from "@/components/layout/PageCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useHomeStore } from "@/store/homeStore";
import { GroupMeetingsSection } from "@/components/group/GroupMeetingsSection";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { GroupSummaryModal } from "@/components/group/GroupSummaryModal";
import { GroupMemberActionsDropdown } from "@/components/group/GroupMemberActionsDropdown";
import { GroupAdminActionsMenu } from "@/components/group/GroupAdminActionsDropdown";
import { useGroupMeetingsQuery } from "@/queries/useGroupMeetingsQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupQuery } from "@/queries/useGroupQuery";
import {
  useSubscribeSocketToGroups,
  type SubscribeSocketToGroupsCallbacks,
} from "@/hooks/useSubscribeSocketToGroups";

const MAP_DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function GroupViewPage() {
  const { groupId } = useParams({ from: "/groups/$groupId/view" });
  const navigate = useNavigate();
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const { data: group, error, isLoading } = useGroupQuery({ groupId });
  const {
    members,
    isLoading: isMembersLoading,
    isError: isMembersError,
    errorMessage: membersErrorMessage,
    fetchNextPage: loadMoreMembers,
    hasNextPage: hasMoreMembers,
    isFetchingNextPage: isFetchingMoreMembers,
    refetch: refetchMembers,
  } = useGroupMembersQuery({ groupId, limit: 20 });

  const {
    meetings,
    isLoading: isMeetingsLoading,
    isError: isMeetingsError,
    errorMessage: meetingsErrorMessage,
    fetchNextPage: loadMoreMeetings,
    hasNextPage: hasMoreMeetings,
    isFetchingNextPage: isFetchingMoreMeetings,
    // refetch: refetchMeetings,
  } = useGroupMeetingsQuery({ groupId, limit: 20 });

  const uniqueGroupIds = useMemo(() => {
    return [groupId];
  }, [groupId]);

  const callbacks = useMemo<SubscribeSocketToGroupsCallbacks>(() => {
    console.log("computing callbacks");
    return {
      onChangeGroup: (updatedGroup) => {
        if (updatedGroup.groupId === groupId) {
          refetchMembers();
        }
      },
    };
  }, [groupId, refetchMembers]);

  useSubscribeSocketToGroups(uniqueGroupIds, callbacks);

  const header = (
    <Breadcrumb variant="light">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/"
              onClick={() => useHomeStore.getState().setView("groups")}
            >
              My Groups
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Group Details</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  if (isLoading) {
    return (
      <PageCard grow header={header}>
        <div className="py-6 text-sm text-muted-foreground">Loading group…</div>
      </PageCard>
    );
  }
  if (error || !group) {
    return (
      <PageCard grow header={header}>
        <div className="py-6 text-sm text-destructive" role="alert">
          Unable to load group details.
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard grow header={header}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {group?.name ?? "Group"}
          </h1>
          <div
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: group?.description || "No description available.",
            }}
          ></div>

          <div className="my-4">
            <div>
              <b>Location:</b>
            </div>
            <p>{group.address || "No location specified."}</p>
          </div>
        </div>

        {group.userRole === "member" ? (
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/groups/$groupId/notifications" params={{ groupId }}>
                Edit group notification settings
              </Link>
            </Button>
            <GroupMemberActionsDropdown group={group} />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                navigate({
                  to: "/groups/$groupId/edit",
                  params: { groupId },
                })
              }
            >
              <IconPencil />
            </Button>
            <GroupAdminActionsMenu hideViewLink group={group} />
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-md border border-border/60 p-3 text-sm">
        <p>
          <span className="text-muted-foreground">Recurrence:</span>{" "}
          <span className="font-medium capitalize">
            {group.recurrenceFrequency}
          </span>
          {group.recurrenceDaysOfWeek && (
            <span className="font-medium">
              {" "}
              on{" "}
              {group.recurrenceDaysOfWeek
                .map((d) => MAP_DAYS_OF_WEEK[d])
                .join(", ")}
            </span>
          )}
        </p>
        <p>
          <span className="text-muted-foreground">Start time:</span>{" "}
          <span className="font-medium">{group.startTime}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Duration:</span>{" "}
          <span className="font-medium">{group.durationMinutes} minutes</span>
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        {isMembersLoading && members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading members...</p>
        ) : isMembersError && members.length === 0 ? (
          <p className="text-sm text-destructive">
            {membersErrorMessage ?? "Unable to load members."}
          </p>
        ) : (
          <>
            <GroupMembersList variant="detailed" members={members} />
            {hasMoreMembers && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadMoreMembers()}
                disabled={isFetchingMoreMembers}
              >
                {isFetchingMoreMembers ? "Loading..." : "Load More"}
              </Button>
            )}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Meetings</h2>
        <GroupMeetingsSection
          meetings={meetings}
          isLoading={isMeetingsLoading}
          isError={isMeetingsError}
          errorMessage={meetingsErrorMessage}
          hasNextPage={hasMoreMeetings}
          isFetchingNextPage={isFetchingMoreMeetings}
          onLoadMore={() => void loadMoreMeetings()}
        />
      </section>

      <GroupSummaryModal
        groupId={groupId}
        isOpen={isSummaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </PageCard>
  );
}
