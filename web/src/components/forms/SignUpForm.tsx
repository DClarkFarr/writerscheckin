import { Alert, Button, Label, TextInput } from "flowbite-react";
import type { SignUpFormProps } from "../../hooks/useSignUpForm";

export function SignUpForm({
  fields,
  fieldErrors,
  touched,
  formError,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
}: SignUpFormProps) {
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-white text-center">
        Create an account
      </h2>

      {formError && (
        <Alert color="failure">
          <span>{formError}</span>
        </Alert>
      )}

      <div>
        <Label htmlFor="firstName">First name</Label>
        <TextInput
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          value={fields.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          color={
            touched.firstName && fieldErrors.firstName ? "failure" : undefined
          }
          className="mt-1"
        />
        {touched.firstName && fieldErrors.firstName && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.firstName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="lastName">Last name</Label>
        <TextInput
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="family-name"
          value={fields.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          color={
            touched.lastName && fieldErrors.lastName ? "failure" : undefined
          }
          className="mt-1"
        />
        {touched.lastName && fieldErrors.lastName && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.lastName}</p>
        )}
      </div>

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
        <Label htmlFor="password">Password</Label>
        <TextInput
          id="password"
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
        Create account
      </Button>

      <p className="text-sm text-center text-gray-400">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}
