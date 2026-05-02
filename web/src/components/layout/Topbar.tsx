import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../store/authStore";
import Logo from "../../assets/logo-sm.png";
import IconLogin from "~icons/mdi/login";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function Topbar() {
  const { isAuthenticated, clearUser } = useAuthStore();

  return (
    <header className="flex items-center justify-between gap-6 px-4 py-4 sm:px-6">
      <div className="lg:w-1/3 hidden lg:block"></div>
      <div className="w-full max-w-lg lg:flex justify-center">
        <Link
          to="/"
          className="font-bold text-xl text-theme-100 hover:text-theme-200 flex gap-2 items-center"
        >
          <span>
            <img
              src={Logo}
              alt="Writers CheckIn Logo"
              className="h-12 w-auto"
            />
          </span>
          <span>
            <span className="scroll-m-20 text-white text-center text-lg font-bold lg:text-2xl lg:font-extrabold tracking-tight">
              Writers' CheckIn
            </span>
          </span>
        </Link>
      </div>
      <div className="flex items-center justify-end gap-2 lg:w-1/3">
        {isAuthenticated ? (
          <>
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-theme-100 hover:bg-theme-900/50 hover:text-theme-200"
            >
              My Board
            </Link>
            <button
              type="button"
              onClick={clearUser}
              className="rounded-lg px-3 py-2 text-sm font-medium text-theme-100 hover:bg-theme-900/50 hover:text-red-300"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/login"
                  search={{ redir: "" }}
                  className="text-white text-lg"
                >
                  <IconLogin />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Log in</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
