import { Link } from "@tanstack/react-router";
import { PageCard } from "@/components/layout/PageCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useHomeStore } from "@/store/homeStore";

export interface GroupMeetingEditPageProps {
  groupId: string;
  meetingId: string;
}

export function GroupMeetingEditPage({
  groupId,
  meetingId,
}: GroupMeetingEditPageProps) {
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
          <BreadcrumbLink asChild>
            <Link to="/groups/$groupId/edit" params={{ groupId }}>
              Edit Group
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Edit Meeting</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <PageCard grow header={header}>
      <div className="flex flex-col gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Meetings
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Edit Meeting
          </h1>
          <p className="text-sm text-muted-foreground">
            Meeting editor shell for group {groupId} and meeting {meetingId}.
          </p>
        </div>
      </div>
    </PageCard>
  );
}
