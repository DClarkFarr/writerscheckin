import { Alert, Button, Label, TextInput } from "flowbite-react";
import { Link } from "@tanstack/react-router";
import type { ResetPasswordFormProps } from "../../hooks/useResetPasswordForm";

export function ResetPasswordForm({
  fields,
  fieldErrors,
  touched,
  formError,
  isSubmitting,
  isSuccess,
  handleChange,
  handleBlur,
  handleSubmit,
}: ResetPasswordFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Reset password
      </h2>

      {isSuccess ? (
        <>
          <Alert color="success">
            <span>If the account exists, instructions have been sent.</span>
          </Alert>
          <p className="text-sm text-center text-gray-500">
            <Link
              to="/login"
              search={{ redir: "" }}
              className="text-blue-600 hover:underline"
            >
              Back to Log In
            </Link>
          </p>
        </>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-gray-500 text-center">
            Enter your email address and we&apos;ll send a 6-digit reset code.
          </p>

          {formError && (
            <Alert color="failure">
              <span>{formError}</span>
            </Alert>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={handleChange}
              onBlur={handleBlur}
              color={touched.email && fieldErrors.email ? "failure" : undefined}
              className="mt-1"
            />
            {touched.email && fieldErrors.email && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            color="blue"
            disabled={isSubmitting}
            className="w-full"
          >
            Send reset code
          </Button>

          <p className="text-sm text-center text-gray-500">
            <Link
              to="/login"
              search={{ redir: "" }}
              className="text-blue-600 hover:underline"
            >
              Back to Log In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
