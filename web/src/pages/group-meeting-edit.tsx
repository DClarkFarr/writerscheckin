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
import { MeetingForm } from "@/components/forms/MeetingForm";
import { useMeetingForm } from "@/hooks/useMeetingForm";

export interface GroupMeetingEditPageProps {
  groupId: string;
  meetingId: string;
}

export function GroupMeetingEditPage({
  groupId,
  meetingId,
}: GroupMeetingEditPageProps) {
  const {
    meeting,
    isLoading,
    isSaving,
    isPublishing,
    formError,
    saveStatus,
    fieldErrors,
    touched,
    fields,
    handleFieldChange,
    handleFieldBlur,
    handlePublish,
  } = useMeetingForm({
    groupId,
    meetingId,
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
          <BreadcrumbLink asChild>
            <Link to="/groups/$groupId/view" params={{ groupId }}>
              {meeting?.groupId ? "Group Details" : "Back"}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{meeting?.name || "Edit Meeting"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <PageCard grow header={header}>
      <MeetingForm
        meeting={meeting || null}
        isLoading={isLoading}
        isSaving={isSaving}
        isPublishing={isPublishing}
        formError={formError}
        saveStatus={saveStatus}
        fieldErrors={fieldErrors}
        touched={touched}
        fields={fields}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
        onPublish={handlePublish}
      />
    </PageCard>
  );
}
