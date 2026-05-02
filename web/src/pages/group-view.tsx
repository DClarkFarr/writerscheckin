import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { getGroupById } from "@/api/groups";
import { useHomeStore } from "@/store/homeStore";
import { useMyGroupsQuery } from "@/hooks/useMyGroupsQuery";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { GroupSummaryModal } from "@/components/group/GroupSummaryModal";
import { GroupMemberActionsDropdown } from "@/components/group/GroupMemberActionsDropdown";
import { GroupAdminActionsMenu } from "@/components/group/GroupAdminActionsDropdown";

export function GroupViewPage() {
  const { groupId } = useParams({ from: "/groups/$groupId/view" });
  const navigate = useNavigate();
  const [isSummaryOpen, setSummaryOpen] = useState(false);
  const { groups } = useMyGroupsQuery();

  const group = useMemo(
    () => groups.find((item) => item.groupId === groupId) ?? null,
    [groupId, groups],
  );

  const groupQuery = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => getGroupById(groupId),
  });

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

  return (
    <PageCard grow header={header}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {groupQuery.data?.name ?? "Group"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {groupQuery.data?.description || "No description available."}
          </p>
        </div>

        {group &&
          (group.userRole === "member" ? (
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
          ))}
      </div>

      {groupQuery.isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading group…</div>
      ) : groupQuery.isError || !groupQuery.data ? (
        <div className="py-6 text-sm text-destructive" role="alert">
          Unable to load group details.
        </div>
      ) : (
        <>
          <div className="grid gap-3 rounded-md border border-border/60 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Recurrence:</span>{" "}
              <span className="font-medium capitalize">
                {groupQuery.data.recurrenceFrequency}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Start time:</span>{" "}
              <span className="font-medium">{groupQuery.data.startTime}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Duration:</span>{" "}
              <span className="font-medium">
                {groupQuery.data.durationMinutes} minutes
              </span>
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <GroupMembersList
              variant="detailed"
              members={groupQuery.data.members
                .filter((member) => member.status !== "removed")
                .map((member) => ({
                  id: member._id ?? member.identifier,
                  name:
                    member.role === "admin"
                      ? `${member.name} (admin${member.status === "invited" ? ", invited" : ""})`
                      : member.status === "invited"
                        ? `${member.name} (invited)`
                        : member.name,
                  email: member.email ?? undefined,
                  avatar: member.avatarUrl ?? undefined,
                }))}
            />
          </section>
        </>
      )}

      <GroupSummaryModal
        groupId={groupId}
        isOpen={isSummaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </PageCard>
  );
}
