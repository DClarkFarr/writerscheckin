import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EditableMeetingResponse } from "@/api/types/groups";

export interface MeetingFormProps {
  meeting: EditableMeetingResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  formError: string | null;
  saveStatus: string | null;
  fieldErrors: Record<string, string>;
  touched: Record<string, boolean>;
  fields: {
    name: string;
    occursAt: string;
    occursAtTime: string;
    description: string;
    address: string;
    durationMinutes: string;
    publishEmailMessage: string;
    attendanceEmailMessage: string;
    publishHoursBefore: string;
    notifyAttendanceHoursBefore: string;
  };
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onFieldBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onPublish: () => void;
}

export function MeetingForm({
  meeting,
  isLoading,
  isSaving,
  isPublishing,
  formError,
  saveStatus,
  fieldErrors,
  touched,
  fields,
  onFieldChange,
  onFieldBlur,
  onPublish,
}: MeetingFormProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load meeting.</AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="flex flex-col gap-6" noValidate>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Meetings
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Edit Meeting</h1>
        <p className="text-sm text-muted-foreground">
          Update meeting details. Changes are saved automatically.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {saveStatus && (
        <Alert>
          <AlertDescription>{saveStatus}</AlertDescription>
        </Alert>
      )}

      {/* Basic Meeting Info */}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Meeting name *</FieldLabel>
          <Input
            id="name"
            name="name"
            value={fields.name}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            aria-invalid={!!fieldErrors.name}
          />
          {touched.name && fieldErrors.name && (
            <FieldError>{fieldErrors.name}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="occursAt">Meeting date *</FieldLabel>
          <Input
            id="occursAt"
            name="occursAt"
            type="date"
            value={fields.occursAt}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            aria-invalid={!!fieldErrors.occursAt}
          />
          {touched.occursAt && fieldErrors.occursAt && (
            <FieldError>{fieldErrors.occursAt}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="occursAtTime">Meeting time *</FieldLabel>
          <Input
            id="occursAtTime"
            name="occursAtTime"
            type="time"
            value={fields.occursAtTime}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            aria-invalid={!!fieldErrors.occursAtTime}
          />
          {touched.occursAtTime && fieldErrors.occursAtTime && (
            <FieldError>{fieldErrors.occursAtTime}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Location</FieldLabel>
          <Input
            id="address"
            name="address"
            value={fields.address}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            placeholder="e.g., 123 Main Street"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            value={fields.description}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            placeholder="Meeting details, guidelines, what to bring..."
            rows={4}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="durationMinutes">
            Duration (minutes) *
          </FieldLabel>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="15"
            step="15"
            value={fields.durationMinutes}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            aria-invalid={!!fieldErrors.durationMinutes}
          />
          {touched.durationMinutes && fieldErrors.durationMinutes && (
            <FieldError>{fieldErrors.durationMinutes}</FieldError>
          )}
        </Field>
      </FieldGroup>

      {/* Admin-Only Settings */}
      <fieldset className="space-y-4 border-t pt-4">
        <legend className="text-sm font-semibold">Admin Settings</legend>

        <Field>
          <FieldLabel htmlFor="publishEmailMessage">Publish message</FieldLabel>
          <Textarea
            id="publishEmailMessage"
            name="publishEmailMessage"
            value={fields.publishEmailMessage}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            placeholder="Message sent when meeting is published..."
            rows={2}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="attendanceEmailMessage">
            Attendance message
          </FieldLabel>
          <Textarea
            id="attendanceEmailMessage"
            name="attendanceEmailMessage"
            value={fields.attendanceEmailMessage}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
            placeholder="Message sent before meeting asking for attendance..."
            rows={2}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="publishHoursBefore">
            Auto-publish hours before meeting
          </FieldLabel>
          <Input
            id="publishHoursBefore"
            name="publishHoursBefore"
            type="number"
            min="0"
            value={fields.publishHoursBefore}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
          />
          {meeting.publishScheduledFor && (
            <FieldDescription>
              Scheduled to auto-publish{" "}
              {new Date(meeting.publishScheduledFor).toLocaleString()}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="notifyAttendanceHoursBefore">
            Send attendance reminder hours before meeting
          </FieldLabel>
          <Input
            id="notifyAttendanceHoursBefore"
            name="notifyAttendanceHoursBefore"
            type="number"
            min="0"
            value={fields.notifyAttendanceHoursBefore}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={isSaving || isPublishing}
          />
        </Field>
      </fieldset>

      {/* Publish Section */}
      {meeting.canPublishNow && (
        <fieldset className="space-y-4 border-t pt-4">
          <legend className="text-sm font-semibold text-blue-600">
            Draft Meeting
          </legend>
          <p className="text-sm text-muted-foreground">
            This meeting is currently a draft and is not visible to members.
            Publish it to make it available.
          </p>
          <Button
            type="button"
            onClick={onPublish}
            disabled={isSaving || isPublishing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isPublishing ? "Publishing..." : "Publish Meeting"}
          </Button>
        </fieldset>
      )}

      {meeting.status === "published" && (
        <fieldset className="space-y-2 border-t pt-4">
          <legend className="text-sm font-semibold text-green-600">
            Published
          </legend>
          <p className="text-sm text-green-600">
            This meeting is live and members can check in.
          </p>
        </fieldset>
      )}
    </form>
  );
}
