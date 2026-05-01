import { useNavigate, useSearch } from "@tanstack/react-router";
import { LoginForm } from "../components/forms/LoginForm";
import { useLoginForm } from "../hooks/useLoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({
    from: "/_auth/login",
  });
  const formProps = useLoginForm({
    onLoginSuccess: () => void navigate({ to: search.redir || "/" }),
  });
  return <LoginForm {...formProps} />;
}
