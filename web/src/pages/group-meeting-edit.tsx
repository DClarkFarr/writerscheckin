import { PageCard } from "@/components/layout/PageCard";

export interface GroupMeetingEditPageProps {
  groupId: string;
  meetingId: string;
}

export function GroupMeetingEditPage({
  groupId,
  meetingId,
}: GroupMeetingEditPageProps) {
  return (
    <PageCard grow>
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
