import { useState } from "react";
import { LoginForm } from "@/components/forms/LoginForm";
import { SignUpForm } from "@/components/forms/SignUpForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useSignUpForm } from "@/hooks/useSignUpForm";

interface JoinInviteLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

export function JoinInviteLoginDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: JoinInviteLoginDialogProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const loginFormProps = useLoginForm({
    onLoginSuccess,
  });

  const signUpFormProps = useSignUpForm({
    onSignUpSuccess: onLoginSuccess,
  });

  const isSubmitting =
    mode === "login"
      ? loginFormProps.isSubmitting
      : signUpFormProps.isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setMode("login");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>
            {mode === "login"
              ? "Log in to join this group"
              : "Create an account to join this group"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to accept your invitation. We will continue automatically after login."
              : "Create your account to accept this invitation. We will continue automatically after signup."}
          </DialogDescription>
        </DialogHeader>
        {mode === "login" ? (
          <LoginForm {...loginFormProps} />
        ) : (
          <SignUpForm {...signUpFormProps} />
        )}
        {mode === "login" ? (
          <div className="mt-2 text-center text-sm">
            <button
              type="button"
              className="font-medium text-blue-600 hover:underline"
              onClick={() => setMode("signup")}
              disabled={isSubmitting}
            >
              Create account
            </button>
          </div>
        ) : (
          <div className="mt-2 text-center text-sm">
            <button
              type="button"
              className="font-medium text-blue-600 hover:underline"
              onClick={() => setMode("login")}
              disabled={isSubmitting}
            >
              Already have an account? Log in
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
