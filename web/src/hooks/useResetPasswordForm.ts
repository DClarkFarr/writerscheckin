import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordRequest } from "../api/auth";
import { ApiError } from "../api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Fields = {
  email: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;
type Touched = Partial<Record<keyof Fields, boolean>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validation ───────────────────────────────────────────────────────────────

function validateField(name: keyof Fields, value: string): string | undefined {
  switch (name) {
    case "email": {
      if (!value.trim()) return "Email is required";
      if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
      return undefined;
    }
  }
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "Too many attempts. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseResetPasswordFormOptions {
  onResetSuccess: (email: string) => void;
}

export interface ResetPasswordFormProps {
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  formError: string | null;
  isSubmitting: boolean;
  isSuccess: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function useResetPasswordForm(
  opts: UseResetPasswordFormOptions,
): ResetPasswordFormProps {
  const [fields, setFields] = useState<Fields>({ email: "" });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: (_data, variables) => {
      opts.onResetSuccess(variables.email);
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
    setTouched({ email: true });
    const errors: FieldErrors = {
      email: validateField("email", fields.email),
    };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    setFormError(null);
    mutate({ email: fields.email.trim() });
  };

  return {
    fields,
    fieldErrors,
    touched,
    formError,
    isSubmitting: isPending,
    isSuccess,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
