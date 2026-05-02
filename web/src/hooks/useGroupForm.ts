import {
  useDeferredValue,
  useMemo,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/types";
import {
  createGroup,
  searchGroupParticipants,
  updateGroup,
} from "@/api/groups";
import type {
  EditableGroupResponse,
  GroupFormDraft,
  ParticipantSummary,
  SaveGroupResponse,
} from "@/api/types/groups";
import type { GroupUserOption } from "@/components/forms/GroupUserMultiSelect";

type Fields = {
  name: string;
  description: string;
  address: string;
  startTime: string;
  durationMinutes: string;
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
      | "recurrenceFrequency"
      | "recurrenceDaysOfWeek"
      | "publicMessage"
      | "attendanceMessage"
      | "admins"
      | "members"
    >
  >,
  "durationMinutes"
> & {
  durationMinutes?: string | number;
};

export interface UseGroupFormOptions {
  existingGroup?: GroupFormInitialValues;
  groupId?: string;
  mode?: "create" | "edit";
  onSuccess?: (result: SaveGroupResponse) => void | Promise<void>;
}

export interface GroupFormProps {
  mode: "create" | "edit";
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  recurrenceDaysOfWeek: number[];
  selectedAdmins: GroupUserOption[];
  selectedMembers: GroupUserOption[];
  adminOptions: GroupUserOption[];
  memberOptions: GroupUserOption[];
  adminSearchValue: string;
  memberSearchValue: string;
  isSubmitting: boolean;
  isAdminSearchLoading: boolean;
  isMemberSearchLoading: boolean;
  formError: string | null;
  submitNotice: string | null;
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
  handleRecurrenceDayToggle: (day: number) => void;
  handleAdminsChange: (value: GroupUserOption[]) => void;
  handleMembersChange: (value: GroupUserOption[]) => void;
  handleAdminSearchChange: (value: string) => void;
  handleMemberSearchChange: (value: string) => void;
  handleSubmit: (event: FormEvent) => void;
}

const DEFAULT_FIELDS: Fields = {
  name: "",
  description: "",
  address: "",
  startTime: "18:00",
  durationMinutes: "60",
  recurrenceFrequency: "weekly",
  publicMessage: "",
  attendanceMessage: "",
};

const normalizeParticipant = (
  participant: ParticipantSummary,
): GroupUserOption => ({
  value: participant.userId,
  label: participant.displayName,
  avatarUrl: participant.avatarUrl,
});

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
  const queryClient = useQueryClient();
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
  const [selectedAdmins, setSelectedAdmins] = useState<GroupUserOption[]>(
    (options.existingGroup?.admins ?? []).map(normalizeParticipant),
  );
  const [selectedMembers, setSelectedMembers] = useState<GroupUserOption[]>(
    (options.existingGroup?.members ?? []).map(normalizeParticipant),
  );
  const [adminSearchValue, setAdminSearchValue] = useState("");
  const [memberSearchValue, setMemberSearchValue] = useState("");
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  const deferredAdminSearchValue = useDeferredValue(adminSearchValue);
  const deferredMemberSearchValue = useDeferredValue(memberSearchValue);

  const adminQuery = useQuery({
    queryKey: ["group-participants", "admins", deferredAdminSearchValue],
    queryFn: () => searchGroupParticipants(deferredAdminSearchValue),
    staleTime: 60_000,
  });

  const memberQuery = useQuery({
    queryKey: ["group-participants", "members", deferredMemberSearchValue],
    queryFn: () => searchGroupParticipants(deferredMemberSearchValue),
    staleTime: 60_000,
  });

  const adminOptions = useMemo(
    () => (adminQuery.data?.items ?? []).map(normalizeParticipant),
    [adminQuery.data?.items],
  );

  const memberOptions = useMemo(
    () => (memberQuery.data?.items ?? []).map(normalizeParticipant),
    [memberQuery.data?.items],
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: GroupFormDraft) => {
      if (options.mode === "edit") {
        if (!options.groupId) {
          throw new Error("Group ID is required.");
        }

        return updateGroup(options.groupId, values);
      }

      return createGroup(values);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      if (options.groupId) {
        await queryClient.invalidateQueries({
          queryKey: ["group-form", options.groupId],
        });
      }

      setFormError(null);

      if (options.onSuccess) {
        await options.onSuccess(result);
        return;
      }

      setSubmitNotice(
        options.mode === "edit" ? "Group changes saved." : "Group created.",
      );
    },
    onError: (error) => {
      setSubmitNotice(null);
      setFormError(mapApiError(error));
    },
  });

  const handleFieldChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    const fieldName = name as keyof Fields;

    setFields((current) => ({ ...current, [fieldName]: value }));
    setSubmitNotice(null);
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
    setSubmitNotice(null);
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
    setSubmitNotice(null);
    setFormError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextTouched: Touched = {
      name: true,
      startTime: true,
      durationMinutes: true,
      recurrenceDaysOfWeek: true,
    };
    const errors = validateAll(fields, recurrenceDaysOfWeek);

    setTouched((current) => ({ ...current, ...nextTouched }));
    setFieldErrors(errors);

    if (hasErrors(errors)) {
      setSubmitNotice(null);
      return;
    }

    mutate({
      name: fields.name.trim(),
      description: fields.description,
      address: fields.address.trim(),
      startTime: fields.startTime,
      durationMinutes: Number.parseInt(fields.durationMinutes, 10),
      recurrenceFrequency: fields.recurrenceFrequency,
      recurrenceDaysOfWeek,
      publicMessage: fields.publicMessage.trim(),
      attendanceMessage: fields.attendanceMessage.trim(),
      adminUserIds: selectedAdmins.map((participant) => participant.value),
      memberUserIds: selectedMembers.map((participant) => participant.value),
    });
  };

  return {
    mode: options.mode ?? "create",
    fields,
    fieldErrors,
    touched,
    recurrenceDaysOfWeek,
    selectedAdmins,
    selectedMembers,
    adminOptions,
    memberOptions,
    adminSearchValue,
    memberSearchValue,
    isSubmitting: isPending,
    isAdminSearchLoading: adminQuery.isLoading,
    isMemberSearchLoading: memberQuery.isLoading,
    formError,
    submitNotice,
    submitLabel: options.mode === "edit" ? "Save Changes" : "Create Group",
    handleFieldChange,
    handleFieldBlur,
    handleDescriptionChange,
    handleRecurrenceDayToggle,
    handleAdminsChange: setSelectedAdmins,
    handleMembersChange: setSelectedMembers,
    handleAdminSearchChange: setAdminSearchValue,
    handleMemberSearchChange: setMemberSearchValue,
    handleSubmit,
  };
}
