import { changeUserPassword } from "@/api/users";
import { ApiError } from "@/api/types";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

type Fields = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;
type Touched = Partial<Record<keyof Fields, boolean>>;

function validateField(
  name: keyof Fields,
  value: string,
  fields: Fields,
): string | undefined {
  switch (name) {
    case "currentPassword": {
      if (!value) return "Current password is required";
      return undefined;
    }
    case "newPassword": {
      if (!value) return "New password is required";
      if (value.length < 5) return "New password must be at least 5 characters";
      if (value.length > 128)
        return "New password must be at most 128 characters";
      if (value === fields.currentPassword) {
        return "New password must be different from your current password";
      }
      return undefined;
    }
    case "newPasswordConfirm": {
      if (!value) return "Please confirm your new password";
      if (value !== fields.newPassword) {
        return "New password and confirmation do not match";
      }
      return undefined;
    }
  }
}

function validateAll(fields: Fields): FieldErrors {
  return {
    currentPassword: validateField(
      "currentPassword",
      fields.currentPassword,
      fields,
    ),
    newPassword: validateField("newPassword", fields.newPassword, fields),
    newPasswordConfirm: validateField(
      "newPasswordConfirm",
      fields.newPasswordConfirm,
      fields,
    ),
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

  return "Unable to change your password right now. Please try again.";
}

export interface ChangePasswordFormProps {
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

export function useChangePasswordForm(): ChangePasswordFormProps {
  const [fields, setFields] = useState<Fields>({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      setFormError(null);
      setFields({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
      });
      setTouched({});
      setFieldErrors({});
    },
    onError: (error) => {
      setSuccessMessage(null);
      setFormError(mapApiError(error));
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const key = name as keyof Fields;
    const nextFields = { ...fields, [key]: value };

    setFields(nextFields);
    if (touched[key]) {
      setFieldErrors((current) => ({
        ...current,
        [key]: validateField(key, value, nextFields),
        ...(key === "newPassword"
          ? {
              newPasswordConfirm: validateField(
                "newPasswordConfirm",
                nextFields.newPasswordConfirm,
                nextFields,
              ),
            }
          : {}),
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
      [key]: validateField(key, value, fields),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setTouched({
      currentPassword: true,
      newPassword: true,
      newPasswordConfirm: true,
    });

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
          currentPassword: fields.currentPassword,
          newPassword: fields.newPassword,
          newPasswordConfirm: fields.newPasswordConfirm,
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
