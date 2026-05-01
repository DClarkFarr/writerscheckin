import { Alert, Button, Label, TextInput } from "flowbite-react";
import { Link } from "@tanstack/react-router";
import type { ResetPasswordConfirmForm } from "../../hooks/useResetPasswordConfirmForm";

export interface ResetPasswordConfirmFormViewProps extends ResetPasswordConfirmForm {
  onBackToRequest: () => void;
}

export function ResetPasswordConfirmForm({
  fields,
  fieldErrors,
  touched,
  formError,
  isSubmitting,
  emailFieldReadonly,
  handleChange,
  handleBlur,
  handleSubmit,
  onBackToRequest,
}: ResetPasswordConfirmFormViewProps) {
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-white text-center">
        Enter reset code
      </h2>

      <p className="text-sm text-gray-400 text-center">
        Check your email for the 6-digit code, then set a new password.
      </p>

      {formError && (
        <Alert color="failure">
          <span>{formError}</span>
        </Alert>
      )}

      <div>
        <Label htmlFor="confirm-email">Email</Label>
        <TextInput
          id="confirm-email"
          name="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          onBlur={handleBlur}
          color={touched.email && fieldErrors.email ? "failure" : undefined}
          disabled={emailFieldReadonly}
          className="mt-1"
        />
        {touched.email && fieldErrors.email && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="code">Reset code</Label>
        <TextInput
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={fields.code}
          onChange={handleChange}
          onBlur={handleBlur}
          color={touched.code && fieldErrors.code ? "failure" : undefined}
          className="mt-1"
        />
        {touched.code && fieldErrors.code && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.code}</p>
        )}
      </div>

      <div>
        <Label htmlFor="new-password">New password</Label>
        <TextInput
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={fields.password}
          onChange={handleChange}
          onBlur={handleBlur}
          color={
            touched.password && fieldErrors.password ? "failure" : undefined
          }
          className="mt-1"
        />
        {touched.password && fieldErrors.password && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        color="blue"
        disabled={isSubmitting}
        className="w-full"
      >
        Reset password
      </Button>

      <button
        type="button"
        className="text-sm text-blue-600 hover:underline"
        onClick={onBackToRequest}
      >
        Request a new code
      </button>

      <p className="text-sm text-center text-gray-400">
        <Link
          to="/login"
          search={{ redir: "" }}
          className="text-blue-600 hover:underline"
        >
          Back to Log In
        </Link>
      </p>
    </form>
  );
}
