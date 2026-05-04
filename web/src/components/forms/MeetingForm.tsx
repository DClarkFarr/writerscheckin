import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatStaticDateTime } from "@/lib/dateFormat";
import { RichTextEditor } from "./RichTextEditor";

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
  onChangeDescription: (value: string) => void;
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
  onChangeDescription,
  onFieldBlur,
  onPublish,
}: MeetingFormProps) {
  console.log(fields.description);
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

  console.log("rendienrg form");
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
          <RichTextEditor
            value={fields.description}
            onChange={onChangeDescription}
            isSimpleMode
          />
          <FieldDescription>
            Use the basic editor mode for a public-facing description of the
            meeting.
          </FieldDescription>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Publication Status: Draft
            </CardTitle>
            <CardDescription>
              <p>
                This meeting is currently a draft and is not visible to members.
                Publish it to make it available.
              </p>

              {meeting.publishScheduledFor && (
                <p className="text-gray-800 text-sm my-2">
                  <b>Automatic publication:</b>
                  <br />
                  This meeting will is scheduled to be automatically published
                  on {formatStaticDateTime(meeting.publishScheduledFor)}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={onPublish}
              disabled={isSaving || isPublishing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPublishing ? "Publishing..." : "Publish Meeting"}
            </Button>
          </CardContent>
        </Card>
      )}

      {meeting.status === "published" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Publication Status: Published
            </CardTitle>
            <CardDescription>
              This meeting is live and members can check in.
            </CardDescription>
          </CardHeader>
          <CardContent>TODO: Cancel button here</CardContent>
        </Card>
      )}
    </form>
  );
}
