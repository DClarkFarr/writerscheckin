import { updateUserProfile } from "@/api/users";
import { ApiError, type AuthUser } from "@/api/types";
import { meQueryKey } from "@/queries/useMeQuery";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type Fields = {
  firstName: string;
  lastName: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;
type Touched = Partial<Record<keyof Fields, boolean>>;

function validateField(name: keyof Fields, value: string): string | undefined {
  const label = name === "firstName" ? "First name" : "Last name";
  const trimmed = value.trim();

  if (!trimmed) {
    return `${label} is required`;
  }

  if (trimmed.length > 80) {
    return `${label} is too long`;
  }

  return undefined;
}

function validateAll(fields: Fields): FieldErrors {
  return {
    firstName: validateField("firstName", fields.firstName),
    lastName: validateField("lastName", fields.lastName),
  };
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) {
      return error.serverMessage;
    }
  }

  return "Unable to update your name right now. Please try again.";
}

export interface UseUpdateProfileFormOptions {
  user: AuthUser | null;
}

export interface UpdateProfileFormProps {
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  formError: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent) => void;
}

export function useUpdateProfileForm({
  user,
}: UseUpdateProfileFormOptions): UpdateProfileFormProps {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const [fields, setFields] = useState<Fields>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFields({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    });
  }, [user?.firstName, user?.lastName]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: ({ user: updatedUser }) => {
      setUser(updatedUser);
      queryClient.setQueryData(meQueryKey(), updatedUser);
      setSuccessMessage("Name updated.");
      setFormError(null);
      setFields({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      });
    },
    onError: (error) => {
      setSuccessMessage(null);
      setFormError(mapApiError(error));
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const key = name as keyof Fields;

    setFields((current) => ({ ...current, [key]: value }));
    if (touched[key]) {
      setFieldErrors((current) => ({
        ...current,
        [key]: validateField(key, value),
      }));
    }

    setFormError(null);
    setSuccessMessage(null);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const key = name as keyof Fields;

    setTouched((current) => ({ ...current, [key]: true }));
    setFieldErrors((current) => ({
      ...current,
      [key]: validateField(key, value),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setTouched({ firstName: true, lastName: true });
    const errors = validateAll(fields);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    const submit = async () => {
      try {
        await mutateAsync({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
        });
      } catch {
        // Mutation errors are surfaced via onError.
      }
    };

    void submit();
  };

  return {
    fields,
    fieldErrors,
    touched,
    formError,
    successMessage,
    isSubmitting: isPending,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
