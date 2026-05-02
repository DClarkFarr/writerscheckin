import { Link, useNavigate } from "@tanstack/react-router";
import { SignUpForm } from "../components/forms/SignUpForm";
import { useSignUpForm } from "../hooks/useSignUpForm";
import { PageCard } from "@/components/layout/PageCard";

export function SignUpPage() {
  const navigate = useNavigate();
  const formProps = useSignUpForm({
    onSignUpSuccess: () => void navigate({ to: "/" }),
  });
  return (
    <PageCard
      footer={
        <div className="flex justify-center pt-4 text-sm">
          <span className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              search={{ redir: "" }}
              className="text-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </span>
        </div>
      }
      grow
    >
      <SignUpForm {...formProps} />
    </PageCard>
  );
}
