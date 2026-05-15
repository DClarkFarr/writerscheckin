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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import IconEye from "~icons/mdi/eye";

import { Input } from "@/components/ui/input";
import type { EditableMeetingResponse } from "@/api/types/groups";
import { formatStaticDateTime } from "@/lib/dateFormat";
import { RichTextEditor } from "./RichTextEditor";
import { Link } from "@tanstack/react-router";

export interface MeetingFormProps {
  meeting: EditableMeetingResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isCancelling: boolean;
  formError: string | null;
  saveStatus: string | null;
  isCancelDialogOpen: boolean;
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
    endCheckinHoursBefore: string;
  };
  onFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onChangeDescription: (value: string) => void;
  onChangePublishEmailMessage: (value: string) => void;
  onChangeAttendanceEmailMessage: (value: string) => void;
  onFieldBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onPublish: () => void;
  onCancelDialogOpenChange: (open: boolean) => void;
  onCancelMeeting: () => void;
}

export function MeetingForm({
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
  onFieldChange,
  onChangeDescription,
  onChangePublishEmailMessage,
  onChangeAttendanceEmailMessage,
  onFieldBlur,
  onPublish,
  onCancelDialogOpenChange,
  onCancelMeeting,
}: MeetingFormProps) {
  const formDisabled =
    isSaving || isPublishing || isCancelling || !!meeting?.cancelledAt;

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
        <div className="flex">
          <div className="grow">
            <h1 className="text-2xl font-semibold text-foreground">
              Edit Meeting
            </h1>
            <p className="text-sm text-muted-foreground">
              Update meeting details. Changes are saved automatically.
            </p>
          </div>
          <div>
            <Link
              to={`/groups/$groupId/meetings/$meetingId/view`}
              params={{
                groupId: meeting.groupId,
                meetingId: meeting.meetingId,
              }}
            >
              <Button type="button" variant="ghost">
                <IconEye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
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
            disabled={formDisabled}
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
            disabled={formDisabled}
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
            step="900"
            value={fields.occursAtTime}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={formDisabled}
            aria-invalid={!!fieldErrors.occursAtTime}
          />
          {touched.occursAtTime && fieldErrors.occursAtTime && (
            <FieldError>{fieldErrors.occursAtTime}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="endCheckinHoursBefore">
            Check-in closes (hours before start)
          </FieldLabel>
          <Input
            id="endCheckinHoursBefore"
            name="endCheckinHoursBefore"
            type="number"
            min="0"
            value={fields.endCheckinHoursBefore}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
            disabled={formDisabled}
            aria-invalid={!!fieldErrors.endCheckinHoursBefore}
          />
          {touched.endCheckinHoursBefore &&
            fieldErrors.endCheckinHoursBefore && (
              <FieldError>{fieldErrors.endCheckinHoursBefore}</FieldError>
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
            disabled={formDisabled}
            placeholder="e.g., 123 Main Street"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <RichTextEditor
            value={fields.description}
            onChange={onChangeDescription}
            isSimpleMode
            disabled={formDisabled}
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
            disabled={formDisabled}
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
          <RichTextEditor
            value={fields.publishEmailMessage}
            onChange={onChangePublishEmailMessage}
            disabled={formDisabled}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="attendanceEmailMessage">
            Attendance message
          </FieldLabel>
          <RichTextEditor
            value={fields.attendanceEmailMessage}
            onChange={onChangeAttendanceEmailMessage}
            disabled={formDisabled}
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
            disabled={formDisabled}
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
            disabled={formDisabled}
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
              disabled={
                isSaving ||
                isPublishing ||
                isCancelling ||
                !!meeting.cancelledAt
              }
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
              This meeting is live and members can check in. Canceling will
              notify everyone who RSVP'd and lock further edits/check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!meeting.cancelledAt && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onCancelDialogOpenChange(true)}
                disabled={
                  !meeting.canCancel ||
                  isSaving ||
                  isPublishing ||
                  isCancelling ||
                  !!meeting.cancelledAt
                }
                className="w-full"
              >
                {isCancelling ? "Cancelling..." : "Cancel Meeting"}
              </Button>
            )}
            {!!meeting.cancelledAt && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  This meeting has been cancelled. Members who RSVP'd have been
                  notified and the meeting is locked from further edits.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCancelDialogOpen} onOpenChange={onCancelDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this meeting?</DialogTitle>
            <DialogDescription>
              This action marks the meeting as cancelled and sends a
              notification to members who RSVP'd. You cannot undo this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancelDialogOpenChange(false)}
              disabled={isCancelling}
            >
              Keep Meeting
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onCancelMeeting}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
