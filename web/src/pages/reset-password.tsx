import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ResetPasswordForm } from "../components/forms/ResetPasswordForm";
import { ResetPasswordConfirmForm } from "../components/forms/ResetPasswordConfirmForm";
import { useResetPasswordForm } from "../hooks/useResetPasswordForm";
import { useResetPasswordConfirmForm } from "../hooks/useResetPasswordConfirmForm";

type ResetStep = "request" | "confirm" | "done";

export function ResetPasswordPage() {
  const [step, setStep] = useState<ResetStep>("request");
  const [requestEmail, setRequestEmail] = useState<string>("");

  const formProps = useResetPasswordForm({
    onResetSuccess: (email) => {
      setRequestEmail(email);
      confirmFormProps.setFields((prev) => ({ ...prev, email }));
      setStep("confirm");
    },
  });

  const confirmFormProps = useResetPasswordConfirmForm({
    initialEmail: requestEmail,
    onConfirmSuccess: () => {
      setStep("done");
    },
  });

  if (step === "request") {
    return <ResetPasswordForm {...formProps} />;
  }

  if (step === "confirm") {
    return (
      <ResetPasswordConfirmForm
        {...confirmFormProps}
        onBackToRequest={() => setStep("request")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-foreground text-center">
        Password updated
      </h2>

      <Alert>
        <AlertDescription>
          Your password was updated successfully.
        </AlertDescription>
      </Alert>

      <p className="text-sm text-center text-muted-foreground">
        <Link
          to="/login"
          search={{ redir: "" }}
          className="text-primary hover:underline font-medium"
        >
          Continue to Log In
        </Link>
      </p>
    </div>
  );
}
