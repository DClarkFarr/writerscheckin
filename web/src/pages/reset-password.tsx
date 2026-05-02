import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ResetPasswordForm } from "../components/forms/ResetPasswordForm";
import { ResetPasswordConfirmForm } from "../components/forms/ResetPasswordConfirmForm";
import { useResetPasswordForm } from "../hooks/useResetPasswordForm";
import { useResetPasswordConfirmForm } from "../hooks/useResetPasswordConfirmForm";
import { PageCard } from "@/components/layout/PageCard";

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

  const backToLoginFooter = (
    <div className="flex justify-center pt-4 text-sm">
      <span className="text-muted-foreground">
        Remember your password?{" "}
        <Link
          to="/login"
          search={{ redir: "" }}
          className="text-primary hover:underline font-medium"
        >
          Log in
        </Link>
      </span>
    </div>
  );

  if (step === "request") {
    return (
      <PageCard footer={backToLoginFooter} grow>
        <ResetPasswordForm {...formProps} />
      </PageCard>
    );
  }

  if (step === "confirm") {
    return (
      <PageCard footer={backToLoginFooter} grow>
        <ResetPasswordConfirmForm
          {...confirmFormProps}
          onBackToRequest={() => setStep("request")}
        />
      </PageCard>
    );
  }

  return (
    <PageCard
      footer={
        <div className="flex justify-center pt-4 text-sm">
          <Link
            to="/login"
            search={{ redir: "" }}
            className="text-primary hover:underline font-medium"
          >
            Continue to Log In
          </Link>
        </div>
      }
      grow
    >
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-foreground text-center">
          Password updated
        </h2>

        <Alert>
          <AlertDescription>
            Your password was updated successfully.
          </AlertDescription>
        </Alert>
      </div>
    </PageCard>
  );
}
