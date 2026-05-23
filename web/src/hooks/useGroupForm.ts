import {
  useEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { ApiError } from "@/api/types";
import { useGroupMemberMutations } from "@/queries/useGroupMemberMutations";
import { useSaveGroupMutation } from "@/queries/useSaveGroupMutation";
import type {
  EditableGroupResponse,
  GroupFormDraft,
  GroupFormMember,
  GroupMemberRole,
  SaveGroupResponse,
} from "@/api/types/groups";
import { alert } from "@/utils/alert";

type Fields = {
  name: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: string;
  endCheckinHoursBefore: string;
  notifyAttendanceHoursBefore: string;
  publishHoursBefore: string;
  recurrenceFrequency: "weekly" | "biweekly";
  publicMessage: string;
  attendanceMessage: string;
};

type FieldName = keyof Fields | "recurrenceDaysOfWeek";
type FieldErrors = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

export type GroupFormInitialValues = Omit<
  Partial<
    Pick<
      EditableGroupResponse,
      | "name"
      | "description"
      | "address"
      | "startTime"
      | "durationMinutes"
      | "endCheckinHoursBefore"
      | "notifyAttendanceHoursBefore"
      | "publishHoursBefore"
      | "recurrenceFrequency"
      | "recurrenceDaysOfWeek"
      | "publicMessage"
      | "attendanceMessage"
    >
  >,
  "durationMinutes"
> & {
  durationMinutes?: string | number;
  members?: GroupFormMember[];
};

export interface UseGroupFormOptions {
  existingGroup?: GroupFormInitialValues;
  groupId?: string;
  mode?: "create" | "edit";
  onSuccess?: (result: SaveGroupResponse) => void | Promise<void>;
}

export interface GroupFormProps {
  mode: "create" | "edit";
  groupId?: string;
  fields: Fields;
  fieldErrors: FieldErrors;
  group?: EditableGroupResponse;
  touched: Touched;
  recurrenceDaysOfWeek: number[];
  selectedMembers: GroupFormMember[];
  isSubmitting: boolean;
  formError: string | null;
  submitLabel: string;
  handleFieldChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleFieldBlur: (
    event: FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleDescriptionChange: (value: string) => void;
  handlePublicMessageChange: (value: string) => void;
  handleAttendanceMessageChange: (value: string) => void;
  handleRecurrenceDayToggle: (day: number) => void;
  handleMemberAdd: (member: GroupFormMember) => void;
  handleMemberRoleChange: (memberId: string, role: GroupMemberRole) => void;
  handleMemberDelete: (memberId: string) => void;
  handleSubmit: (event: FormEvent) => void;
}

const DEFAULT_FIELDS: Fields = {
  name: "",
  description: "",
  address: "",
  startTime: "18:00",
  durationMinutes: "60",
  endCheckinHoursBefore: "2",
  notifyAttendanceHoursBefore: "2",
  publishHoursBefore: "24",
  recurrenceFrequency: "weekly",
  publicMessage: `
    <p>Good morning my author friends!</p>
    <p>This is a reminder about the next meeting of our group, [meetingName], on [meetingDate] at [meetingTime] at [meetingAddress].</p>
    <p>Please RSVP if you plan to attend AND if you have pages to read.
    (Even if you're not reading, we need an accurate headcount to know how many copies to bring)</p>
    <p>&nbsp;</p>
    [checkinButton]
    <p>&nbsp;</p>
    <p><b>*To ensure your reservation, please respond to this email no later than 5pm [dateOfNotification]. </b></p>
    <p>If we have more than six readers, this will allow us to reserve a second room in advance.</p>
    <p>&nbsp;</p>
    <p>Warmly,</p>
    <p>Administrator Name here</p>
  `,
  attendanceMessage: `
    <p>Hello my author friends!</p>
    <p>Our next meeting of [groupName] is coming up on [meetingDate] at [meetingTime] at [meetingAddress].</p>
    <p>I'm very excited to see all of you there!</p>
    <p>&nbsp;</p>
    <p>Below, here are the current RSVPs for this meeting</p>
    [attendanceList]
    <p>&nbsp;</p>
    <p>If you have not RSVP'd you can still come and participate. If you have pages to share, please contact the group admin at: <b>[adminEmail]</b>.</p>
    <p>&nbsp;</p>
    <p>Warmly,</p>
    <p>Administrator Name here</p>
  `,
};

const validateField = (
  name: FieldName,
  fields: Fields,
  recurrenceDaysOfWeek: number[],
): string | undefined => {
  switch (name) {
    case "name":
      return fields.name.trim() ? undefined : "Group name is required.";
    case "startTime":
      return fields.startTime ? undefined : "Start time is required.";
    case "durationMinutes": {
      const duration = Number.parseInt(fields.durationMinutes, 10);
      if (Number.isNaN(duration)) {
        return "Duration is required.";
      }
      if (duration < 60 || duration > 240 || duration % 15 !== 0) {
        return "Duration must be 60-240 minutes in 15-minute increments.";
      }
      return undefined;
    }
    case "endCheckinHoursBefore": {
      const cutoff = Number.parseInt(fields.endCheckinHoursBefore, 10);
      if (Number.isNaN(cutoff)) {
        return "Check-in cutoff is required.";
      }
      if (cutoff < 0) {
        return "Check-in cutoff must be 0 or greater.";
      }
      return undefined;
    }
    case "notifyAttendanceHoursBefore": {
      const notify = Number.parseInt(fields.notifyAttendanceHoursBefore, 10);
      if (Number.isNaN(notify)) {
        return "Notify hours is required.";
      }
      if (notify < 0) {
        return "Notify hours must be 0 or greater.";
      }
      return undefined;
    }
    case "publishHoursBefore": {
      const publish = Number.parseInt(fields.publishHoursBefore, 10);
      if (Number.isNaN(publish)) {
        return "Publish hours is required.";
      }
      if (publish < 0) {
        return "Publish hours must be 0 or greater.";
      }
      return undefined;
    }
    case "recurrenceDaysOfWeek":
      return recurrenceDaysOfWeek.length > 0
        ? undefined
        : "Select at least one recurrence day.";
    default:
      return undefined;
  }
};

const validateAll = (
  fields: Fields,
  recurrenceDaysOfWeek: number[],
): FieldErrors => ({
  name: validateField("name", fields, recurrenceDaysOfWeek),
  startTime: validateField("startTime", fields, recurrenceDaysOfWeek),
  durationMinutes: validateField(
    "durationMinutes",
    fields,
    recurrenceDaysOfWeek,
  ),
  endCheckinHoursBefore: validateField(
    "endCheckinHoursBefore",
    fields,
    recurrenceDaysOfWeek,
  ),
  notifyAttendanceHoursBefore: validateField(
    "notifyAttendanceHoursBefore",
    fields,
    recurrenceDaysOfWeek,
  ),
  publishHoursBefore: validateField(
    "publishHoursBefore",
    fields,
    recurrenceDaysOfWeek,
  ),
  recurrenceDaysOfWeek: validateField(
    "recurrenceDaysOfWeek",
    fields,
    recurrenceDaysOfWeek,
  ),
});

const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some((value) => value !== undefined);

const mapApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.serverMessage ?? "Unable to prepare the group form.";
  }

  return "Unable to prepare the group form.";
};

export function useGroupForm(
  options: UseGroupFormOptions = {},
): GroupFormProps {
  const [fields, setFields] = useState<Fields>({
    ...DEFAULT_FIELDS,
    name: options.existingGroup?.name ?? DEFAULT_FIELDS.name,
    description:
      options.existingGroup?.description ?? DEFAULT_FIELDS.description,
    address: options.existingGroup?.address ?? DEFAULT_FIELDS.address,
    startTime: options.existingGroup?.startTime ?? DEFAULT_FIELDS.startTime,
    durationMinutes:
      options.existingGroup?.durationMinutes !== undefined
        ? String(options.existingGroup.durationMinutes)
        : DEFAULT_FIELDS.durationMinutes,
    endCheckinHoursBefore:
      options.existingGroup?.endCheckinHoursBefore !== undefined
        ? String(options.existingGroup.endCheckinHoursBefore)
        : DEFAULT_FIELDS.endCheckinHoursBefore,
    notifyAttendanceHoursBefore:
      options.existingGroup?.notifyAttendanceHoursBefore !== undefined
        ? String(options.existingGroup.notifyAttendanceHoursBefore)
        : DEFAULT_FIELDS.notifyAttendanceHoursBefore,
    publishHoursBefore:
      options.existingGroup?.publishHoursBefore !== undefined
        ? String(options.existingGroup.publishHoursBefore)
        : DEFAULT_FIELDS.publishHoursBefore,
    recurrenceFrequency:
      options.existingGroup?.recurrenceFrequency ??
      DEFAULT_FIELDS.recurrenceFrequency,
    publicMessage:
      options.existingGroup?.publicMessage ?? DEFAULT_FIELDS.publicMessage,
    attendanceMessage:
      options.existingGroup?.attendanceMessage ??
      DEFAULT_FIELDS.attendanceMessage,
  });
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(
    options.existingGroup?.recurrenceDaysOfWeek ?? [1],
  );
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<
    GroupFormMember[]
  >(options.existingGroup?.members ?? []);
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const saveGroupMutation = useSaveGroupMutation({
    mode: options.mode ?? "create",
    groupId: options.groupId,
  });
  const { mutateAsync: saveGroupAsync, isPending } = saveGroupMutation;
  const { addMember, updateMemberRole, removeMember } =
    useGroupMemberMutations();
  const { mutateAsync: addMemberAsync } = addMember;
  const { mutateAsync: updateMemberRoleAsync } = updateMemberRole;
  const { mutateAsync: removeMemberAsync } = removeMember;

  useEffect(() => {
    if (!Array.isArray(options.existingGroup?.members)) {
      return;
    }

    queueMicrotask(() => {
      setSelectedGroupMembers((current) => {
        const nextById = new Map(
          options.existingGroup?.members?.map((member) => [
            member._id ?? member.identifier,
            member,
          ]),
        );

        const merged = [...current];
        for (const member of nextById.values()) {
          const key = member._id ?? member.identifier;
          const existingIndex = merged.findIndex(
            (item) => (item._id ?? item.identifier) === key,
          );
          if (existingIndex === -1) {
            merged.push(member);
          } else {
            merged[existingIndex] = {
              ...merged[existingIndex],
              ...member,
            };
          }
        }

        return merged;
      });
    });
  }, [options.existingGroup?.members]);

  const handleFieldChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    const fieldName = name as keyof Fields;

    setFields((current) => ({ ...current, [fieldName]: value }));
    setFormError(null);

    if (touched[fieldName]) {
      const nextFields = { ...fields, [fieldName]: value };
      setFieldErrors((current) => ({
        ...current,
        [fieldName]: validateField(fieldName, nextFields, recurrenceDaysOfWeek),
      }));
    }
  };

  const handleFieldBlur = (
    event: FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name } = event.target;
    const fieldName = name as FieldName;
    setTouched((current) => ({ ...current, [fieldName]: true }));
    setFieldErrors((current) => ({
      ...current,
      [fieldName]: validateField(fieldName, fields, recurrenceDaysOfWeek),
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFields((current) => ({ ...current, description: value }));
    setFormError(null);
  };

  const handlePublicMessageChange = (value: string) => {
    setFields((current) => ({ ...current, publicMessage: value }));
    setFormError(null);
  };

  const handleAttendanceMessageChange = (value: string) => {
    setFields((current) => ({ ...current, attendanceMessage: value }));
    setFormError(null);
  };

  const handleRecurrenceDayToggle = (day: number) => {
    setRecurrenceDaysOfWeek((current) => {
      const nextValue = current.includes(day)
        ? current.filter((currentDay) => currentDay !== day)
        : [...current, day].sort((left, right) => left - right);

      if (touched.recurrenceDaysOfWeek) {
        setFieldErrors((errors) => ({
          ...errors,
          recurrenceDaysOfWeek: validateField(
            "recurrenceDaysOfWeek",
            fields,
            nextValue,
          ),
        }));
      }

      return nextValue;
    });
    setFormError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const errors = validateAll(fields, recurrenceDaysOfWeek);

    setTouched({});
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      return;
    }

    const payload: GroupFormDraft = {
      name: fields.name.trim(),
      description: fields.description,
      address: fields.address.trim(),
      startTime: fields.startTime,
      durationMinutes: Number.parseInt(fields.durationMinutes, 10),
      endCheckinHoursBefore: Number.parseInt(fields.endCheckinHoursBefore, 10),
      notifyAttendanceHoursBefore: Number.parseInt(
        fields.notifyAttendanceHoursBefore,
        10,
      ),
      publishHoursBefore: Number.parseInt(fields.publishHoursBefore, 10),
      recurrenceFrequency: fields.recurrenceFrequency,
      recurrenceDaysOfWeek,
      publicMessage: fields.publicMessage.trim(),
      attendanceMessage: fields.attendanceMessage.trim(),
      members: selectedGroupMembers,
    };

    const submit = async () => {
      try {
        const result = await saveGroupAsync(payload);
        setFormError(null);

        if (options.onSuccess) {
          await options.onSuccess(result);
          return;
        }

        alert.success(
          options.mode === "edit" ? "Group changes saved." : "Group created.",
        );
      } catch (error) {
        setFormError(mapApiError(error));
      }
    };

    void submit();
  };

  return {
    mode: options.mode ?? "create",
    groupId: options.groupId,
    fields,
    fieldErrors,
    touched,
    recurrenceDaysOfWeek,
    selectedMembers: selectedGroupMembers,
    isSubmitting: isPending,
    formError,
    submitLabel: options.mode === "edit" ? "Save Changes" : "Create Group",
    handleFieldChange,
    handleFieldBlur,
    handleDescriptionChange,
    handlePublicMessageChange,
    handleAttendanceMessageChange,
    handleRecurrenceDayToggle,
    handleMemberAdd: (member: GroupFormMember) => {
      let wasAdded = false;

      setSelectedGroupMembers((current) => {
        const alreadyExists = current.some(
          (existing) =>
            existing.identifier === member.identifier ||
            (member.email && existing.email === member.email),
        );

        if (alreadyExists) {
          return current;
        }

        wasAdded = true;

        return [...current, member];
      });

      if (!wasAdded) {
        return;
      }

      if (options.mode === "edit" && options.groupId) {
        const groupId = options.groupId;
        const add = async () => {
          try {
            const created = await addMemberAsync({ groupId, member });

            setSelectedGroupMembers((current) =>
              current.map((existing) => {
                const matches =
                  existing.identifier === member.identifier ||
                  (member.email && existing.email === member.email);

                if (!matches || existing._id) {
                  return existing;
                }

                return {
                  ...existing,
                  _id: created._id,
                  identifier: created.identifier,
                  userId: created.userId,
                  email: created.email,
                  status: created.status,
                };
              }),
            );
          } catch (err) {
            if (err instanceof ApiError) {
              alert.error(err.serverMessage ?? "Failed to add member.");
            }

            setSelectedGroupMembers((current) =>
              current.filter(
                (existing) =>
                  existing.identifier !== member.identifier &&
                  (!member.email || existing.email !== member.email),
              ),
            );
          }
        };

        void add();
      }
    },
    handleMemberRoleChange: (memberId: string, role: GroupMemberRole) => {
      // Capture the member's old role before changing for error recovery
      const oldRole = selectedGroupMembers.find(
        (member) => (member._id ?? member.identifier) === memberId,
      )?.role;

      setSelectedGroupMembers((current) =>
        current.map((member) =>
          (member._id ?? member.identifier) === memberId
            ? { ...member, role }
            : member,
        ),
      );
      if (
        options.mode === "edit" &&
        options.groupId &&
        memberId.length === 24
      ) {
        const groupId = options.groupId;
        const updateRole = async () => {
          try {
            await updateMemberRoleAsync({
              groupId,
              memberId,
              role,
            });
          } catch (err) {
            console.log("got err", err);
            if (err instanceof ApiError) {
              alert.error(err.serverMessage ?? "Failed to update member role.");
            }
            // Restore the old role if the update failed
            // The mutation's onError has already rolled back the cache
            if (oldRole !== undefined) {
              setSelectedGroupMembers((current) =>
                current.map((member) =>
                  (member._id ?? member.identifier) === memberId
                    ? { ...member, role: oldRole }
                    : member,
                ),
              );
            }
          }
        };

        void updateRole();
      }
    },
    handleMemberDelete: (memberId: string) => {
      // Capture the member before removing for error recovery
      const memberToRestore = selectedGroupMembers.find(
        (member) => (member._id ?? member.identifier) === memberId,
      );

      setSelectedGroupMembers((current) =>
        current.filter(
          (member) => (member._id ?? member.identifier) !== memberId,
        ),
      );
      if (
        options.mode === "edit" &&
        options.groupId &&
        memberId.length === 24
      ) {
        const groupId = options.groupId;
        const deleteMember = async () => {
          try {
            await removeMemberAsync({
              groupId,
              memberId,
            });
          } catch (err) {
            console.log("got err", err);
            if (err instanceof ApiError) {
              alert.error(err.serverMessage ?? "Failed to remove member.");
            }
            // Restore the member if the deletion failed
            // The mutation's onError has already rolled back the cache
            if (memberToRestore) {
              setSelectedGroupMembers((current) => [
                ...current,
                memberToRestore,
              ]);
            }
          }
        };

        void deleteMember();
      }
    },
    handleSubmit,
  };
}
