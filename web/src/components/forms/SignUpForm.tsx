import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 grow-1"
    >
      <h2 className="text-2xl font-bold text-foreground text-center">
        Create an account
      </h2>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={fields.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.firstName && !!fieldErrors.firstName}
            size="lg"
            placeholder="John"
          />
          {touched.firstName && fieldErrors.firstName && (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.firstName}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={fields.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.lastName && !!fieldErrors.lastName}
            size="lg"
            placeholder="Doe"
          />
          {touched.lastName && fieldErrors.lastName && (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.lastName}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.email && !!fieldErrors.email}
            size="lg"
            placeholder="you@example.com"
          />
          {touched.email && fieldErrors.email && (
            <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={fields.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && !!fieldErrors.password}
            size="lg"
            placeholder="••••••••"
          />
          {touched.password && fieldErrors.password && (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </Field>
      </FieldGroup>

      <div className="mt-auto"></div>
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
