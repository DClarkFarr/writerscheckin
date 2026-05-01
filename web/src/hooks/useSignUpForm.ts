import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signup } from "../api/auth";
import { ApiError } from "../api/types";
import { useAuthStore } from "../store/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;
type Touched = Partial<Record<keyof Fields, boolean>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validation ───────────────────────────────────────────────────────────────

function validateField(name: keyof Fields, value: string): string | undefined {
  switch (name) {
    case "firstName":
    case "lastName": {
      const label = name === "firstName" ? "First name" : "Last name";
      if (!value.trim()) return `${label} is required`;
      return undefined;
    }
    case "email": {
      if (!value.trim()) return "Email is required";
      if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
      return undefined;
    }
    case "password": {
      if (!value) return "Password is required";
      if (value.length < 5) return "Password must be at least 5 characters";
      if (value.length > 128) return "Password must be at most 128 characters";
      if (!/[A-Z]/.test(value))
        return "Password must contain at least one uppercase letter";
      if (!/[^a-zA-Z0-9]/.test(value))
        return "Password must contain at least one special character";
      return undefined;
    }
  }
}

function validateAll(fields: Fields): FieldErrors {
  return {
    firstName: validateField("firstName", fields.firstName),
    lastName: validateField("lastName", fields.lastName),
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
    if (err.status === 400) return err.serverMessage;
    if (err.status === 409) return "An account with this email already exists.";
    if (err.status === 429) return "Too many attempts. Please try again later.";
  }
  return "Something went wrong. Please try again.";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseSignUpFormOptions {
  onSignUpSuccess: () => void;
}

export interface SignUpFormProps {
  fields: Fields;
  fieldErrors: FieldErrors;
  touched: Touched;
  formError: string | null;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function useSignUpForm(opts: UseSignUpFormOptions): SignUpFormProps {
  const setUser = useAuthStore((s) => s.setUser);

  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: signup,
    onSuccess: (user) => {
      setUser(user);
      opts.onSignUpSuccess();
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
    const allTouched: Touched = {
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    };
    setTouched(allTouched);
    const errors = validateAll(fields);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    setFormError(null);
    mutate({
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      password: fields.password,
    });
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
