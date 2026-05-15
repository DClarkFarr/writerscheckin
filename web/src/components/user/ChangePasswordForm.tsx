import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ChangePasswordFormProps } from "@/hooks/useChangePasswordForm";

export function ChangePasswordForm({
  fields,
  fieldErrors,
  touched,
  formError,
  successMessage,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
}: ChangePasswordFormProps) {
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="bg-green-100 border-green-500 text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={fields.currentPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={
              touched.currentPassword && !!fieldErrors.currentPassword
            }
            size="lg"
          />
          {touched.currentPassword && fieldErrors.currentPassword ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.currentPassword}
            </p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={fields.newPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.newPassword && !!fieldErrors.newPassword}
            size="lg"
          />
          {touched.newPassword && fieldErrors.newPassword ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.newPassword}
            </p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="newPasswordConfirm">
            Confirm new password
          </FieldLabel>
          <Input
            id="newPasswordConfirm"
            name="newPasswordConfirm"
            type="password"
            autoComplete="new-password"
            value={fields.newPasswordConfirm}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={
              touched.newPasswordConfirm && !!fieldErrors.newPasswordConfirm
            }
            size="lg"
          />
          {touched.newPasswordConfirm && fieldErrors.newPasswordConfirm ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.newPasswordConfirm}
            </p>
          ) : null}
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Updating password..." : "Change password"}
      </Button>
    </form>
  );
}
