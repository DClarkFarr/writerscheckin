import { useNavigate } from "@tanstack/react-router";
import { SignUpForm } from "../components/forms/SignUpForm";
import { useSignUpForm } from "../hooks/useSignUpForm";

export function SignUpPage() {
  const navigate = useNavigate();
  const formProps = useSignUpForm({
    onSignUpSuccess: () => void navigate({ to: "/" }),
  });
  return <SignUpForm {...formProps} />;
}
