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
import { useHomeStore } from "@/store/homeStore";
import { Link, useNavigate } from "@tanstack/react-router";

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

  const header = (
    <Breadcrumb>
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
          <BreadcrumbPage>Create Group</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <PageCard grow header={header}>
      <GroupForm {...formProps} />
    </PageCard>
  );
}
