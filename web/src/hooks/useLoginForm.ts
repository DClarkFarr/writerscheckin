import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/auth";
import { ApiError } from "../api/types";
import { useAuthStore } from "../store/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Fields = {
  email: string;
  password: string;
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
    case "password": {
      if (!value) return "Password is required";
      return undefined;
    }
  }
}

function validateAll(fields: Fields): FieldErrors {
  return {
    email: validateField("email", fields.email),
    password: validateField("password", fields.password),
  };
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Invalid email or password.";
    if (err.status === 429) return "Too many attempts. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseLoginFormOptions {
  onLoginSuccess: () => void;
}

export interface LoginFormProps {
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  formError: string | null;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function useLoginForm(opts: UseLoginFormOptions): LoginFormProps {
  const setUser = useAuthStore((s) => s.setUser);

  const [fields, setFields] = useState<Fields>({ email: "", password: "" });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      opts.onLoginSuccess();
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
    setTouched({ email: true, password: true });
    const errors = validateAll(fields);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    setFormError(null);
    mutate({ email: fields.email.trim(), password: fields.password });
  };

  return {
    fields,
    fieldErrors,
    touched,
    formError,
    isSubmitting: isPending,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
