import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, type RichTextEditorHandle } from "./RichTextEditor";
import { GroupUserMultiSelect } from "./GroupUserMultiSelect";
import type { GroupFormProps } from "@/hooks/useGroupForm";
import { useRef, type KeyboardEventHandler } from "react";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function GroupForm({
  mode,
  groupId,
  fields,
  fieldErrors,
  touched,
  recurrenceDaysOfWeek,
  selectedMembers,
  isSubmitting,
  formError,
  submitNotice,
  submitLabel,
  handleFieldChange,
  handleFieldBlur,
  handleDescriptionChange,
  handleRecurrenceDayToggle,
  handleMemberAdd,
  handleMemberRoleChange,
  handleMemberDelete,
  handleSubmit,
}: GroupFormProps) {
  const descriptionEditorRef = useRef<RichTextEditorHandle>(null);

  const handleNextField: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.name === "name" && e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      descriptionEditorRef.current?.focus();
    }
  };

  const heading = mode === "edit" ? "Edit Group" : "Create Group";

  const summary =
    mode === "edit"
      ? "Update the group profile, recurrence, messages, and membership defaults."
      : "Set group defaults, recurrence, messages, and membership before creating meetings.";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Groups
        </p>
        <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {submitNotice ? (
        <Alert>
          <AlertDescription>{submitNotice}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Group name</FieldLabel>
          <Input
            id="name"
            name="name"
            value={fields.name}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            onKeyDown={handleNextField}
            placeholder="Downtown Writers Circle"
            size="lg"
            aria-invalid={touched.name && !!fieldErrors.name}
          />
          <FieldError>{touched.name ? fieldErrors.name : undefined}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <div className="rounded-xl border border-border bg-white p-3">
            <RichTextEditor
              ref={descriptionEditorRef}
              value={fields.description}
              onChange={handleDescriptionChange}
              isSimpleMode
            />
          </div>
          <FieldDescription>
            Use the basic editor mode for a public-facing description of the
            group.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Textarea
            id="address"
            name="address"
            value={fields.address}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            placeholder="123 Main Street, Springfield"
          />
        </Field>
      </FieldGroup>

      <FieldGroup className="md:flex-row gap-4">
        <Field>
          <FieldLabel htmlFor="startTime">Start time</FieldLabel>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            step={900}
            value={fields.startTime}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            size="lg"
            aria-invalid={touched.startTime && !!fieldErrors.startTime}
          />
          <FieldError>
            {touched.startTime ? fieldErrors.startTime : undefined}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="durationMinutes">Duration (minutes)</FieldLabel>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={60}
            max={240}
            step={15}
            value={fields.durationMinutes}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            size="lg"
            aria-invalid={
              touched.durationMinutes && !!fieldErrors.durationMinutes
            }
          />
          <FieldError>
            {touched.durationMinutes ? fieldErrors.durationMinutes : undefined}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="recurrenceFrequency">Recurrence</FieldLabel>
          <select
            id="recurrenceFrequency"
            name="recurrenceFrequency"
            value={fields.recurrenceFrequency}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            className="min-h-8 rounded-md border border-input bg-gray-100 px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend>Recurrence days</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((option) => {
            const checked = recurrenceDaysOfWeek.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${checked ? "border-primary bg-primary/10 text-foreground" : "border-border bg-white text-muted-foreground"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleRecurrenceDayToggle(option.value)}
                  className="size-4"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        <FieldError>
          {touched.recurrenceDaysOfWeek
            ? fieldErrors.recurrenceDaysOfWeek
            : undefined}
        </FieldError>
      </FieldSet>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="publicMessage">Invitation message</FieldLabel>
          <Textarea
            id="publicMessage"
            name="publicMessage"
            value={fields.publicMessage}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            placeholder="Notify attendees of upcoming meeting."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="attendanceMessage">
            Attendance message
          </FieldLabel>
          <Textarea
            id="attendanceMessage"
            name="attendanceMessage"
            value={fields.attendanceMessage}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            placeholder="Share attendance instructions or reminders for members."
          />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="group-members">Members</FieldLabel>
          <GroupUserMultiSelect
            inputId="group-members"
            placeholder="Search by name or email"
            groupId={groupId}
            selected={selectedMembers}
            onMemberAdd={handleMemberAdd}
            onMemberRoleChange={handleMemberRoleChange}
            onMemberDelete={handleMemberDelete}
          />
          <FieldDescription>
            Search by name or email. Use the role selector on each row to set
            admin or member status. Unknown emails will be invited.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Preparing Group..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
