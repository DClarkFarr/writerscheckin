import { Link } from "@tanstack/react-router";
import Logo from "../assets/logo-icon-md.png";
import { useAuthStore } from "@/store/authStore";
import { PageCard } from "@/components/layout/PageCard";
export function Home() {
  const user = useAuthStore((state) => state.user);
  return user ? <HomeAuthenticated /> : <HomeUnauthenticated />;
}

const HomeAuthenticated = () => {
  return (
    <PageCard className="mt-6">
      <div>Tabs</div>
      <div>sdfsf</div>
    </PageCard>
  );
};

const HomeUnauthenticated = () => {
  return (
    <div className="">
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center pt-10">
        <img
          src={Logo}
          alt="Writers CheckIn Logo"
          className="rounded-2xl max-w-xs"
        />
        <h1 className="text-5xl font-bold text-theme-50">
          Welcome to Writers CheckIn
        </h1>
        <p className="text-lg text-theme-200 max-w-md">
          Plan, plot, and build your stories.
        </p>
        <Link
          to="/login"
          search={{ redir: "" }}
          className="rounded-lg bg-theme-600 px-5 py-2.5 text-sm font-medium text-theme-50 transition-colors hover:bg-theme-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-300/60 active:bg-theme-700"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
};
