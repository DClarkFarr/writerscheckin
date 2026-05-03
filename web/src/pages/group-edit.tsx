import { Link } from "@tanstack/react-router";
import type { EditableGroupResponse } from "@/api/types/groups";
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
import { useGroupForm } from "@/hooks/useGroupForm";
import { useGroupFormQuery } from "@/queries/useGroupFormQuery";
import { useHomeStore } from "@/store/homeStore";

export interface GroupEditPageProps {
  groupId: string;
}

export function GroupEditPage({ groupId }: GroupEditPageProps) {
  const groupQuery = useGroupFormQuery({ groupId });

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
        />
      )}
    </PageCard>
  );
}

interface LoadedGroupEditFormProps {
  groupId: string;
  existingGroup: EditableGroupResponse;
}

function LoadedGroupEditForm({
  groupId,
  existingGroup,
}: LoadedGroupEditFormProps) {
  const formProps = useGroupForm({
    mode: "edit",
    groupId,
    existingGroup,
  });

  return <GroupForm {...formProps} />;
}
