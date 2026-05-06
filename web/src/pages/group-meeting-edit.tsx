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
    isCancelling,
    formError,
    saveStatus,
    isCancelDialogOpen,
    fieldErrors,
    touched,
    fields,
    handleFieldChange,
    onChangeDescription,
    handleFieldBlur,
    handlePublish,
    setIsCancelDialogOpen,
    handleCancelMeeting,
  } = useMeetingForm({
    groupId,
    meetingId,
  });

  const header = (
    <Breadcrumb variant="light">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">My Meetings</Link>
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
      <MeetingForm
        meeting={meeting || null}
        isLoading={isLoading}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isCancelling={isCancelling}
        formError={formError}
        saveStatus={saveStatus}
        isCancelDialogOpen={isCancelDialogOpen}
        fieldErrors={fieldErrors}
        touched={touched}
        fields={fields}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
        onChangeDescription={onChangeDescription}
        onPublish={handlePublish}
        onCancelDialogOpenChange={setIsCancelDialogOpen}
        onCancelMeeting={handleCancelMeeting}
      />
    </PageCard>
  );
}
