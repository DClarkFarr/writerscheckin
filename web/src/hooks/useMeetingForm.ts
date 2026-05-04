import { useEffect, useState, useRef, useCallback } from "react";
import { useEditableMeetingQuery } from "@/queries/useEditableMeetingQuery";
import { useSaveMeetingMutation } from "@/queries/useSaveMeetingMutation";
import { usePublishMeetingMutation } from "@/queries/usePublishMeetingMutation";
import type { UpdateMeetingInput } from "@/api/types/groups";

const AUTOSAVE_DELAY = 1500; // 1.5 seconds

interface MeetingFormFields {
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
}

interface UseMeetingFormProps {
  groupId: string;
  meetingId: string;
}

export function useMeetingForm({ groupId, meetingId }: UseMeetingFormProps) {
  const { data: meeting, isLoading } = useEditableMeetingQuery({
    groupId,
    meetingId,
  });

  const saveMutation = useSaveMeetingMutation({ groupId, meetingId });
  const publishMutation = usePublishMeetingMutation({ groupId, meetingId });

  const [fields, setFields] = useState<MeetingFormFields>({
    name: "",
    occursAt: "",
    occursAtTime: "",
    description: "",
    address: "",
    durationMinutes: "60",
    publishEmailMessage: "",
    attendanceEmailMessage: "",
    publishHoursBefore: "0",
    notifyAttendanceHoursBefore: "0",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Partial<UpdateMeetingInput>>({});

  // Initialize fields from meeting data
  useEffect(() => {
    const syncFieldState = () => {
      if (!meeting) return;

      const occursAtDate = new Date(meeting.occursAt);
      const dateStr = occursAtDate.toISOString().split("T")[0];
      const timeStr = `${meeting.startTime.hours.toString().padStart(2, "0")}:${meeting.startTime.minutes.toString().padStart(2, "0")}`;

      setFields({
        name: meeting.name,
        occursAt: dateStr,
        occursAtTime: timeStr,
        description: meeting.description,
        address: meeting.address,
        durationMinutes: meeting.durationMinutes.toString(),
        publishEmailMessage: meeting.publishEmailMessage,
        attendanceEmailMessage: meeting.attendanceEmailMessage,
        publishHoursBefore: meeting.publishHoursBefore.toString(),
        notifyAttendanceHoursBefore:
          meeting.notifyAttendanceHoursBefore.toString(),
      });

      // Clear field errors on fresh load
      setFieldErrors({});
      setSaveStatus(null);
    };

    syncFieldState();
  }, [meeting]);

  // Validate individual field
  const validateField = (name: string, value: string): string | undefined => {
    if (name === "name" && !value.trim()) {
      return "Meeting name is required";
    }
    if (name === "occursAt" && !value) {
      return "Meeting date is required";
    }
    if (name === "occursAtTime" && !value) {
      return "Meeting time is required";
    }
    if (name === "durationMinutes") {
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 15) {
        return "Duration must be at least 15 minutes";
      }
    }
    return undefined;
  };

  // Build update payload from current field state
  const buildUpdatePayload = useCallback((): Partial<UpdateMeetingInput> => {
    const payload: Partial<UpdateMeetingInput> = {};

    if (fields.name !== meeting?.name) {
      payload.name = fields.name;
    }

    // Reconstruct occursAt from date + time
    if (fields.occursAt && fields.occursAtTime) {
      const [hours, minutes] = fields.occursAtTime.split(":").map(Number);
      const newDate = new Date(fields.occursAt);
      newDate.setHours(hours, minutes, 0, 0);
      if (newDate.toISOString() !== meeting?.occursAt) {
        payload.occursAt = newDate.toISOString();
      }
    }

    if (fields.description !== meeting?.description) {
      payload.description = fields.description;
    }

    if (fields.address !== meeting?.address) {
      payload.address = fields.address;
    }

    if (parseInt(fields.durationMinutes, 10) !== meeting?.durationMinutes) {
      payload.durationMinutes = parseInt(fields.durationMinutes, 10);
    }

    if (fields.publishEmailMessage !== meeting?.publishEmailMessage) {
      payload.publishEmailMessage = fields.publishEmailMessage;
    }

    if (fields.attendanceEmailMessage !== meeting?.attendanceEmailMessage) {
      payload.attendanceEmailMessage = fields.attendanceEmailMessage;
    }

    if (
      parseInt(fields.publishHoursBefore, 10) !== meeting?.publishHoursBefore
    ) {
      payload.publishHoursBefore = parseInt(fields.publishHoursBefore, 10);
    }

    if (
      parseInt(fields.notifyAttendanceHoursBefore, 10) !==
      meeting?.notifyAttendanceHoursBefore
    ) {
      payload.notifyAttendanceHoursBefore = parseInt(
        fields.notifyAttendanceHoursBefore,
        10,
      );
    }

    return payload;
  }, [fields, meeting]);

  // Perform autosave
  const performAutosave = useCallback(async () => {
    const payload = buildUpdatePayload();

    // Don't save if nothing changed
    if (Object.keys(payload).length === 0) {
      setSaveStatus(null);
      return;
    }

    // Don't resend same payload
    if (JSON.stringify(payload) === JSON.stringify(lastSavedRef.current)) {
      setSaveStatus(null);
      return;
    }

    lastSavedRef.current = payload;
    setSaveStatus("Saving...");

    await saveMutation.mutateAsync(payload as UpdateMeetingInput);
    setSaveStatus(null);
  }, [buildUpdatePayload, saveMutation]);

  // Handle field change with debounced autosave
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Validate on change
      const error = validateField(name, value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }

      // Update field
      setFields((prev) => ({ ...prev, [name]: value }));

      // Debounce autosave
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        performAutosave();
      }, AUTOSAVE_DELAY);
    },
    [performAutosave],
  );

  // Handle field blur (mark as touched)
  const handleFieldBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [],
  );

  // Handle publish
  const handlePublish = useCallback(async () => {
    // First save any pending changes
    const payload = buildUpdatePayload();
    if (Object.keys(payload).length > 0) {
      setSaveStatus("Saving before publish...");
      await saveMutation.mutateAsync(payload as UpdateMeetingInput);
    }

    // Then publish
    await publishMutation.mutateAsync(undefined);
  }, [buildUpdatePayload, saveMutation, publishMutation]);

  const onChangeDescription = useCallback(
    (value: string) => {
      setFields((prev) => ({ ...prev, description: value }));

      // Debounce autosave
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        performAutosave();
      }, AUTOSAVE_DELAY);
    },
    [performAutosave],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    meeting,
    isLoading,
    isSaving: saveMutation.isPending,
    isPublishing: publishMutation.isPending,
    formError: saveMutation.error ? "Failed to save meeting" : null,
    saveStatus,
    fieldErrors,
    touched,
    fields,
    handleFieldChange,
    handleFieldBlur,
    handlePublish,
    onChangeDescription,
  };
}
