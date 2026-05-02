import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../store/authStore";
import Logo from "../../assets/logo-sm.png";

export function Topbar() {
  const { isAuthenticated, clearUser } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b border-theme-800/70 px-4 py-4 sm:px-6">
      <div>
        <Link
          to="/"
          className="font-bold text-xl text-theme-100 hover:text-theme-200"
        >
          <img src={Logo} alt="Writers CheckIn Logo" className="h-12 w-auto" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
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
            <Link
              to="/login"
              search={{ redir: "" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-theme-100 hover:bg-theme-900/50 hover:text-theme-200"
            >
              Log In
            </Link>
            <Link
              to="/sign-up"
              className="rounded-lg bg-theme-600 px-4 py-2 text-sm font-medium text-theme-50 hover:bg-theme-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-300/60"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
