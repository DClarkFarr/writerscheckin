import { useQuery } from "@tanstack/react-query";
import { PageCard } from "@/components/layout/PageCard";
import { GroupForm } from "@/components/forms/GroupForm";
import { useGroupForm } from "@/hooks/useGroupForm";
import { getGroupForm } from "@/api/groups";

export interface GroupEditPageProps {
  groupId: string;
}

export function GroupEditPage({ groupId }: GroupEditPageProps) {
  const groupQuery = useQuery({
    queryKey: ["group-form", groupId],
    queryFn: () => getGroupForm(groupId),
  });

  return (
    <PageCard grow>
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
  existingGroup: NonNullable<
    ReturnType<typeof getGroupForm> extends Promise<infer T> ? T : never
  >;
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
