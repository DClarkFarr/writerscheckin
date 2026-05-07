import { Link } from "@tanstack/react-router";
import Logo from "../assets/logo-icon-md.png";
import { useAuthStore } from "@/store/authStore";
import { PageCard } from "@/components/layout/PageCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHomeStore } from "@/store/homeStore";
import { useCallback } from "react";
import { MyGroupsTab } from "@/components/home/MyGroupsTab";
import { MyMeetingsTab } from "@/components/home/MyMeetingsTab";
import { useGroupInvites } from "@/hooks/useGroupInvites";
export function Home() {
  const user = useAuthStore((state) => state.user);
  return user ? <HomeAuthenticated /> : <HomeUnauthenticated />;
}

const HomeAuthenticated = () => {
  const { view, setView } = useHomeStore();
  const {
    pendingInviteCount,
    isLoading: isInvitesLoading,
    isError: isInvitesError,
  } = useGroupInvites();
  const showInviteBadge =
    !isInvitesLoading && !isInvitesError && pendingInviteCount > 0;

  const onValueChange = useCallback(
    (value: string) => {
      setView(value as "meetings" | "groups");
    },
    [setView],
  );

  return (
    <PageCard className="mt-6">
      <Tabs onValueChange={onValueChange} value={view}>
        <div className="tabs-offset -mt-6 -mx-6">
          <TabsList variant="cardTop">
            <TabsTrigger value="meetings" size="lg" variant="cardTop">
              My Meetings
            </TabsTrigger>
            <TabsTrigger value="groups" size="lg" variant="cardTop">
              <span className="inline-flex items-center gap-2">
                <span>My Groups</span>
                {showInviteBadge ? (
                  <Badge className="bg-orange-700 text-white">
                    {pendingInviteCount}
                  </Badge>
                ) : null}
                {isInvitesLoading ? (
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"
                  />
                ) : null}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="meetings">
          <MyMeetingsTab />
        </TabsContent>
        <TabsContent value="groups">
          <MyGroupsTab />
        </TabsContent>
      </Tabs>
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
