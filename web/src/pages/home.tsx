import { Link } from "@tanstack/react-router";
import { Button } from "flowbite-react";
import { Topbar } from "../components/layout/Topbar";
import Logo from "../assets/plotstack-logo-icon.png";
export function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Topbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center pt-10">
        <img src={Logo} alt="Plotstack Logo" className="rounded-2xl max-w-xs" />
        <h1 className="text-5xl font-bold text-white">Welcome to Plotstack</h1>
        <p className="text-lg text-gray-400 max-w-md">
          Plan, plot, and build your stories.
        </p>
        <Button as={Link} to="/login" size="lg" color="blue">
          Get Started
        </Button>
      </main>
    </div>
  );
}
