import { useState } from "react";
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
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { GroupSummaryModal } from "@/components/group/GroupSummaryModal";
import { GroupMemberActionsDropdown } from "@/components/group/GroupMemberActionsDropdown";
import { GroupAdminActionsMenu } from "@/components/group/GroupAdminActionsDropdown";
import { useGroupQuery } from "@/queries/useGroupQuery";

export function GroupViewPage() {
  const { groupId } = useParams({ from: "/groups/$groupId/view" });
  const navigate = useNavigate();
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const { data: group, error, isLoading } = useGroupQuery({ groupId });

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
        <GroupMembersList variant="detailed" members={group.members} />
      </section>

      <GroupSummaryModal
        groupId={groupId}
        isOpen={isSummaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </PageCard>
  );
}
