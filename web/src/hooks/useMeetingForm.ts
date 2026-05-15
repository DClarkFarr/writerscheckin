import { useEffect, useState, useRef, useCallback } from "react";
import { useEditableMeetingQuery } from "@/queries/useEditableMeetingQuery";
import { useSaveMeetingMutation } from "@/queries/useSaveMeetingMutation";
import { usePublishMeetingMutation } from "@/queries/usePublishMeetingMutation";
import { useCancelMeetingMutation } from "@/queries/useCancelMeetingMutation";
import type { UpdateMeetingInput } from "@/api/types/groups";
import { formatLocalDateField, parseDateTimeFields } from "@/lib/dateFormat";

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
  endCheckinHoursBefore: string;
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
  const cancelMutation = useCancelMeetingMutation({ groupId, meetingId });

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
    endCheckinHoursBefore: "0",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Partial<UpdateMeetingInput>>({});
  const latestFieldsRef = useRef<MeetingFormFields>(fields);
  const latestMeetingRef = useRef(meeting);

  useEffect(() => {
    latestFieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    latestMeetingRef.current = meeting;
  }, [meeting]);

  // Initialize fields from meeting data
  useEffect(() => {
    const syncFieldState = () => {
      if (!meeting || fields.name) return;

      const dateStr = formatLocalDateField(meeting.occursAt);
      const timeStr = `${meeting.startTime.hours.toString().padStart(2, "0")}:${meeting.startTime.minutes.toString().padStart(2, "0")}`;

      const toSet = {
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
        endCheckinHoursBefore: (meeting.endCheckinHoursBefore ?? 0).toString(),
      };
      latestFieldsRef.current = toSet;
      setFields(toSet);

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
    if (name === "endCheckinHoursBefore") {
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 0) {
        return "Check-in cutoff must be 0 or greater";
      }
    }
    return undefined;
  };

  // Build update payload from current field state
  const buildUpdatePayload = useCallback(
    (
      currentFields: MeetingFormFields,
      currentMeeting: typeof meeting,
    ): Partial<UpdateMeetingInput> => {
      const payload: Partial<UpdateMeetingInput> = {};

      if (currentFields.name !== currentMeeting?.name) {
        payload.name = currentFields.name;
      }

      // Reconstruct occursAt from date + time
      if (currentFields.occursAt && currentFields.occursAtTime) {
        const newOccursAt =
          parseDateTimeFields(
            currentFields.occursAt,
            currentFields.occursAtTime,
          ) ?? undefined;

        const [hours, minutes] = currentFields.occursAtTime
          .split(":")
          .map((part) => parseInt(part, 10));

        if (newOccursAt !== currentMeeting?.occursAt) {
          payload.occursAt = newOccursAt;
          payload.startTime = { hours, minutes };
        }
      }

      if (currentFields.description !== currentMeeting?.description) {
        payload.description = currentFields.description;
      }

      if (currentFields.address !== currentMeeting?.address) {
        payload.address = currentFields.address;
      }

      if (
        parseInt(currentFields.durationMinutes, 10) !==
        currentMeeting?.durationMinutes
      ) {
        payload.durationMinutes = parseInt(currentFields.durationMinutes, 10);
      }

      if (
        currentFields.publishEmailMessage !==
        currentMeeting?.publishEmailMessage
      ) {
        payload.publishEmailMessage = currentFields.publishEmailMessage;
      }

      if (
        currentFields.attendanceEmailMessage !==
        currentMeeting?.attendanceEmailMessage
      ) {
        payload.attendanceEmailMessage = currentFields.attendanceEmailMessage;
      }

      if (
        parseInt(currentFields.publishHoursBefore, 10) !==
        currentMeeting?.publishHoursBefore
      ) {
        payload.publishHoursBefore = parseInt(
          currentFields.publishHoursBefore,
          10,
        );
      }

      if (
        parseInt(currentFields.notifyAttendanceHoursBefore, 10) !==
        currentMeeting?.notifyAttendanceHoursBefore
      ) {
        payload.notifyAttendanceHoursBefore = parseInt(
          currentFields.notifyAttendanceHoursBefore,
          10,
        );
      }

      if (
        parseInt(currentFields.endCheckinHoursBefore, 10) !==
        (currentMeeting?.endCheckinHoursBefore ?? 0)
      ) {
        payload.endCheckinHoursBefore = parseInt(
          currentFields.endCheckinHoursBefore,
          10,
        );
      }

      return payload;
    },
    [],
  );

  // Perform autosave
  const performAutosave = useCallback(
    async (
      currentFields: MeetingFormFields = latestFieldsRef.current,
      currentMeeting = latestMeetingRef.current,
    ) => {
      const payload = buildUpdatePayload(currentFields, currentMeeting);

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
    },
    [buildUpdatePayload, saveMutation],
  );

  // Handle field change with debounced autosave
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let nextFields: MeetingFormFields = latestFieldsRef.current;

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
      setFields((prev) => {
        nextFields = { ...prev, [name]: value };
        latestFieldsRef.current = nextFields;
        return nextFields;
      });

      // Debounce autosave
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        void performAutosave(nextFields, latestMeetingRef.current);
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
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // First save any pending changes
    const payload = buildUpdatePayload(
      latestFieldsRef.current,
      latestMeetingRef.current,
    );
    if (Object.keys(payload).length > 0) {
      setSaveStatus("Saving before publish...");
      await saveMutation.mutateAsync(payload as UpdateMeetingInput);
    }

    // Then publish
    await publishMutation.mutateAsync(undefined);
  }, [buildUpdatePayload, saveMutation, publishMutation]);

  const handleCancelMeeting = useCallback(async () => {
    if (cancelMutation.isPending) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    await cancelMutation.mutateAsync(undefined);
    setIsCancelDialogOpen(false);
  }, [cancelMutation]);

  const onChangeDescription = useCallback(
    (value: string) => {
      if (value === latestFieldsRef.current.description) {
        return;
      }
      let nextFields: MeetingFormFields = latestFieldsRef.current;

      setFields((prev) => {
        nextFields = { ...prev, description: value };
        latestFieldsRef.current = nextFields;
        return nextFields;
      });

      // Debounce autosave
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        void performAutosave(nextFields, latestMeetingRef.current);
      }, AUTOSAVE_DELAY);
    },
    [performAutosave],
  );

  const onChangePublishEmailMessage = useCallback(
    (value: string) => {
      if (value === latestFieldsRef.current.publishEmailMessage) {
        return;
      }

      let nextFields: MeetingFormFields = latestFieldsRef.current;
      setFields((prev) => {
        nextFields = { ...prev, publishEmailMessage: value };
        latestFieldsRef.current = nextFields;
        return nextFields;
      });

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        void performAutosave(nextFields, latestMeetingRef.current);
      }, AUTOSAVE_DELAY);
    },
    [performAutosave],
  );

  const onChangeAttendanceEmailMessage = useCallback(
    (value: string) => {
      if (value === latestFieldsRef.current.attendanceEmailMessage) {
        return;
      }

      let nextFields: MeetingFormFields = latestFieldsRef.current;
      setFields((prev) => {
        nextFields = { ...prev, attendanceEmailMessage: value };
        latestFieldsRef.current = nextFields;
        return nextFields;
      });

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        void performAutosave(nextFields, latestMeetingRef.current);
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
    isCancelling: cancelMutation.isPending,
    formError: saveMutation.error ? "Failed to save meeting" : null,
    saveStatus,
    isCancelDialogOpen,
    fieldErrors,
    touched,
    fields,
    handleFieldChange,
    handleFieldBlur,
    handlePublish,
    setIsCancelDialogOpen,
    handleCancelMeeting,
    onChangeDescription,
    onChangePublishEmailMessage,
    onChangeAttendanceEmailMessage,
  };
}
