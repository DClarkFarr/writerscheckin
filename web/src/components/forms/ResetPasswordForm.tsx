import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground text-center">
        Reset password
      </h2>

      {isSuccess ? (
        <>
          <Alert>
            <AlertDescription>
              If the account exists, instructions have been sent to your email.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-center">
            <Link
              to="/login"
              search={{ redir: "" }}
              className="text-primary hover:underline font-medium"
            >
              Back to Log In
            </Link>
          </p>
        </>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-6"
        >
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address and we&apos;ll send a 6-digit reset code.
          </p>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
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
                className="auth-input-lg"
                placeholder="you@example.com"
              />
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="auth-button-lg w-full"
          >
            {isSubmitting ? "Sending code..." : "Send reset code"}
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
      )}
    </div>
  );
}
