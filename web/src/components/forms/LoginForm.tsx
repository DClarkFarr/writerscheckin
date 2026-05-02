import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground text-center">Log in</h2>

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
            <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={fields.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && !!fieldErrors.password}
            className="auth-input-lg"
            placeholder="••••••••"
          />
          {touched.password && fieldErrors.password && (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/sign-up"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </span>
        <Link
          to="/reset-password"
          className="text-primary hover:underline font-medium"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="auth-button-lg w-full"
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
