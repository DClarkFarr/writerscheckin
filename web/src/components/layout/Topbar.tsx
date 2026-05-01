import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../store/authStore";
import Logo from "../../assets/logo-h-transparent-sm.min.png";

export function Topbar() {
  const { isAuthenticated, clearUser } = useAuthStore();

  return (
    <div>
      <div>
        <Link to="/" className="font-bold text-xl text-purple-950">
          <img src={Logo} alt="Writers CheckIn Logo" className="h-12 w-auto" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link
              to="/"
              className="text-sm font-medium text-gray-300 hover:text-blue-600 px-3 py-2"
            >
              My Board
            </Link>
            <button
              type="button"
              onClick={clearUser}
              className="text-sm font-medium text-gray-700 hover:text-red-600 px-3 py-2"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              search={{ redir: "" }}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2"
            >
              Log In
            </Link>
            <Link
              to="/sign-up"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
