import { LoginForm } from "@/components/forms/LoginForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginForm } from "@/hooks/useLoginForm";

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
  const formProps = useLoginForm({
    onLoginSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!formProps.isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Log in to join this group</DialogTitle>
          <DialogDescription>
            Sign in to accept your invitation. We will continue automatically
            after login.
          </DialogDescription>
        </DialogHeader>
        <LoginForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}
