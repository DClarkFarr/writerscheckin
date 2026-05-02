import { PageCard } from "@/components/layout/PageCard";
import { GroupForm } from "@/components/forms/GroupForm";
import { useGroupForm } from "@/hooks/useGroupForm";
import { useNavigate } from "@tanstack/react-router";

export function GroupCreatePage() {
  const navigate = useNavigate();
  const formProps = useGroupForm({
    mode: "create",
    onSuccess: (result) =>
      navigate({
        to: "/groups/$groupId/edit",
        params: { groupId: result.groupId },
      }),
  });

  return (
    <PageCard grow>
      <GroupForm {...formProps} />
    </PageCard>
  );
}
