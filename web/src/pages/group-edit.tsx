import { Link } from "@tanstack/react-router";
import type {
  EditableGroupResponse,
  GroupFormMember,
  GroupMeetingPublic,
} from "@/api/types/groups";
import { PageCard } from "@/components/layout/PageCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { GroupForm } from "@/components/forms/GroupForm";
import { GroupMeetingsSection } from "@/components/group/GroupMeetingsSection";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { Button } from "@/components/ui/button";
import { useGroupForm } from "@/hooks/useGroupForm";
import { useGroupMeetingsQuery } from "@/queries/useGroupMeetingsQuery";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";
import { useGroupFormQuery } from "@/queries/useGroupFormQuery";
import { useHomeStore } from "@/store/homeStore";

export interface GroupEditPageProps {
  groupId: string;
}

export function GroupEditPage({ groupId }: GroupEditPageProps) {
  const groupQuery = useGroupFormQuery({ groupId });
  const membersQuery = useGroupMembersQuery({ groupId, limit: 20 });
  const meetingsQuery = useGroupMeetingsQuery({ groupId, limit: 20 });

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
          <BreadcrumbPage>Edit Group</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <PageCard grow header={header}>
      {groupQuery.isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading group…</div>
      ) : groupQuery.isError ? (
        <div className="py-6 text-sm text-destructive" role="alert">
          Unable to load this group for editing.
        </div>
      ) : !groupQuery.data ? (
        <div className="py-6 text-sm text-destructive" role="alert">
          Group details are unavailable.
        </div>
      ) : (
        <LoadedGroupEditForm
          groupId={groupId}
          existingGroup={groupQuery.data}
          members={membersQuery.members}
          meetings={meetingsQuery.meetings}
          membersQuery={membersQuery}
          meetingsQuery={meetingsQuery}
        />
      )}
    </PageCard>
  );
}

interface LoadedGroupEditFormProps {
  groupId: string;
  existingGroup: EditableGroupResponse;
  members: GroupFormMember[];
  meetings: GroupMeetingPublic[];
  membersQuery: ReturnType<typeof useGroupMembersQuery>;
  meetingsQuery: ReturnType<typeof useGroupMeetingsQuery>;
}

function LoadedGroupEditForm({
  groupId,
  existingGroup,
  members,
  meetings,
  membersQuery,
  meetingsQuery,
}: LoadedGroupEditFormProps) {
  const formProps = useGroupForm({
    mode: "edit",
    groupId,
    existingGroup: {
      ...existingGroup,
      members,
    },
  });

  return (
    <div className="space-y-6">
      <GroupForm {...formProps} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        {membersQuery.isLoading && members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading members...</p>
        ) : membersQuery.isError && members.length === 0 ? (
          <p className="text-sm text-destructive">
            {membersQuery.errorMessage ?? "Unable to load members."}
          </p>
        ) : (
          <>
            <GroupMembersList members={members} variant="detailed" />
            {membersQuery.hasNextPage && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void membersQuery.fetchNextPage()}
                disabled={membersQuery.isFetchingNextPage}
              >
                {membersQuery.isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            )}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Meetings</h2>
        <GroupMeetingsSection
          meetings={meetings}
          isLoading={meetingsQuery.isLoading}
          isError={meetingsQuery.isError}
          errorMessage={meetingsQuery.errorMessage}
          hasNextPage={meetingsQuery.hasNextPage}
          isFetchingNextPage={meetingsQuery.isFetchingNextPage}
          onLoadMore={() => void meetingsQuery.fetchNextPage()}
        />
      </section>
    </div>
  );
}
