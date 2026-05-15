import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { UpdateProfileFormProps } from "@/hooks/useUpdateProfileForm";

export function ProfileSettingsForm({
  fields,
  fieldErrors,
  touched,
  formError,
  successMessage,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
}: UpdateProfileFormProps) {
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert variant="success">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={fields.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.firstName && !!fieldErrors.firstName}
            size="lg"
          />
          {touched.firstName && fieldErrors.firstName ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.firstName}
            </p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={fields.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.lastName && !!fieldErrors.lastName}
            size="lg"
          />
          {touched.lastName && fieldErrors.lastName ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.lastName}
            </p>
          ) : null}
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Saving..." : "Save name"}
      </Button>
    </form>
  );
}
