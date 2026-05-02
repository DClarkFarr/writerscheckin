import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginForm } from "../components/forms/LoginForm";
import { useLoginForm } from "../hooks/useLoginForm";
import { PageCard } from "@/components/layout/PageCard";

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({
    from: "/_auth/login",
  });
  const formProps = useLoginForm({
    onLoginSuccess: () => void navigate({ to: search.redir || "/" }),
  });
  return (
    <PageCard
      footer={
        <div className="flex justify-center pt-4 text-sm">
          <span className="text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </span>
        </div>
      }
      grow
    >
      <LoginForm {...formProps} />
    </PageCard>
  );
}
