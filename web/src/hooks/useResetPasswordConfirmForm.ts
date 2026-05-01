import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordConfirm } from "../api/auth";
import { ApiError } from "../api/types";

type Fields = {
  email: string;
  code: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;
type Touched = Partial<Record<keyof Fields, boolean>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REGEX = /^\d{6}$/;

function validateField(name: keyof Fields, value: string): string | undefined {
  switch (name) {
    case "email": {
      if (!value.trim()) return "Email is required";
      if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
      return undefined;
    }
    case "code": {
      if (!value.trim()) return "Code is required";
      if (!CODE_REGEX.test(value.trim())) return "Code must be 6 digits";
      return undefined;
    }
    case "password": {
      if (!value) return "Password is required";
      if (value.length < 5) return "Password must be at least 5 characters";
      return undefined;
    }
  }
}

function validateAll(fields: Fields): FieldErrors {
  return {
    email: validateField("email", fields.email),
    code: validateField("code", fields.code),
    password: validateField("password", fields.password),
  };
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}

function mapApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Invalid or expired code.";
    if (err.status === 429) return "Too many attempts. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}

export interface UseResetPasswordConfirmFormProps {
  initialEmail?: string;
  onConfirmSuccess: () => void;
}

export interface ResetPasswordConfirmForm {
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  formError: string | null;
  isSubmitting: boolean;
  emailFieldReadonly: boolean;
  setFields: React.Dispatch<React.SetStateAction<Fields>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function useResetPasswordConfirmForm(
  opts: UseResetPasswordConfirmFormProps,
): ResetPasswordConfirmForm {
  const [fields, setFields] = useState<Fields>({
    email: opts.initialEmail ?? "",
    code: "",
    password: "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: resetPasswordConfirm,
    onSuccess: () => {
      opts.onConfirmSuccess();
    },
    onError: (err) => {
      setFormError(mapApiError(err));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (touched[name as keyof Fields]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof Fields, value),
      }));
    }
    setFormError(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof Fields, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, code: true, password: true });
    const errors = validateAll(fields);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setFormError(null);
    mutate({
      email: fields.email.trim(),
      code: fields.code.trim(),
      password: fields.password,
    });
  };

  return {
    emailFieldReadonly: Boolean(opts.initialEmail),
    fields,
    fieldErrors,
    touched,
    formError,
    isSubmitting: isPending,
    handleChange,
    handleBlur,
    handleSubmit,
    setFields,
  };
}
