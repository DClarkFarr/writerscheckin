import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground text-center">
        Enter reset code
      </h2>

      <p className="text-sm text-muted-foreground text-center">
        Check your email for the 6-digit code, then set a new password.
      </p>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="confirm-email">Email</FieldLabel>
          <Input
            id="confirm-email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.email && !!fieldErrors.email}
            disabled={emailFieldReadonly}
            size="lg"
            placeholder="you@example.com"
          />
          {touched.email && fieldErrors.email && (
            <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="code">Reset code</FieldLabel>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={fields.code}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.code && !!fieldErrors.code}
            size="lg"
            placeholder="000000"
          />
          {touched.code && fieldErrors.code && (
            <p className="mt-1 text-sm text-destructive">{fieldErrors.code}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
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

      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? "Resetting password..." : "Reset password"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="text-primary hover:underline font-medium w-full justify-center"
        onClick={onBackToRequest}
      >
        Request a new code
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        <Link
          to="/login"
          search={{ redir: "" }}
          className="text-primary hover:underline font-medium"
        >
          Back to Log In
        </Link>
      </p>
    </form>
  );
}
