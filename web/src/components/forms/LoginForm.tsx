import { Alert, Button, Label, TextInput } from "flowbite-react";
import { Link } from "@tanstack/react-router";
import type { LoginFormProps } from "../../hooks/useLoginForm";

export function LoginForm({
  fields,
  fieldErrors,
  touched,
  formError,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-900 text-center">Log in</h2>

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

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/reset-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        Log in
      </Button>

      <p className="text-sm text-center text-gray-400">
        Don&apos;t have an account?{" "}
        <Link to="/sign-up" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
