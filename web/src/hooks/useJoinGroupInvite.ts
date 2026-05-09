import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { useRespondToJoinInviteMutation } from "@/queries/useRespondToJoinInviteMutation";

interface UseJoinGroupInviteInput {
  membershipId: string;
  inviteToken: string;
  canAccept: boolean;
  canDecline: boolean;
}

export const useJoinGroupInvite = ({
  membershipId,
  inviteToken,
  canAccept,
  canDecline,
}: UseJoinGroupInviteInput) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [pendingAcceptAfterLogin, setPendingAcceptAfterLogin] = useState(false);

  const {
    mutateAsync: respondToInvite,
    isPending: isResponding,
    error: respondError,
  } = useRespondToJoinInviteMutation({
    membershipId,
    inviteToken,
  });

  const acceptInvite = async (): Promise<void> => {
    const result = await respondToInvite("accept");
    if (result.redirectTo === "/") {
      await navigate({ to: "/" });
      return;
    }

    if (result.redirectTo) {
      window.location.assign(result.redirectTo);
    }
  };

  const onAccept = (): void => {
    if (!canAccept || isResponding) {
      return;
    }

    if (isAuthenticated) {
      void acceptInvite();
      return;
    }

    setPendingAcceptAfterLogin(true);
    setIsLoginDialogOpen(true);
  };

  const onDecline = (): void => {
    if (!canDecline || isResponding) {
      return;
    }

    setIsDeclineDialogOpen(true);
  };

  const onConfirmDecline = (): void => {
    if (!canDecline || isResponding) {
      return;
    }

    const submit = async () => {
      await respondToInvite("decline");
      setIsDeclineDialogOpen(false);
    };

    void submit();
  };

  const onLoginDialogOpenChange = (open: boolean): void => {
    setIsLoginDialogOpen(open);
    if (!open) {
      setPendingAcceptAfterLogin(false);
    }
  };

  const onLoginSuccess = (): void => {
    setIsLoginDialogOpen(false);
    if (!pendingAcceptAfterLogin) {
      return;
    }

    setPendingAcceptAfterLogin(false);
    void acceptInvite();
  };

  return {
    isDeclineDialogOpen,
    onDeclineDialogOpenChange: setIsDeclineDialogOpen,
    isLoginDialogOpen,
    onLoginDialogOpenChange,
    onLoginSuccess,
    onAccept,
    onDecline,
    onConfirmDecline,
    isResponding,
    respondError: respondError instanceof Error ? respondError.message : "",
  };
};
