import type { AuthUser } from "@/api/types";
import { useLogoutMenuAction } from "@/hooks/useLogoutMenuAction";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildAccountMenuIdentity } from "./accountMenuIdentity";

export interface AccountMenuProps {
  user: AuthUser;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const identity = buildAccountMenuIdentity(user);
  const { handleLogout, isPending, errorMessage } = useLogoutMenuAction();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-full p-0"
          aria-label={`Account menu for ${identity.displayName}`}
        >
          <Avatar className="size-8">
            {identity.avatarUrl ? (
              <AvatarImage src={identity.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback
              style={{ backgroundColor: identity.avatarColor, color: "white" }}
            >
              {identity.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="pb-1 text-[0.625rem] uppercase tracking-wide">
            Account
          </DropdownMenuLabel>
          <div className="px-2 pb-2">
            <p className="truncate text-xs font-medium text-foreground">
              {identity.displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {identity.email}
            </p>
            {errorMessage ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => {
            navigate({ to: "/user/settings" });
          }}
        >
          Profile Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          {isPending ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
