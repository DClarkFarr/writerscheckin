import { useEffect, useMemo, useRef, useState } from "react";
import { useMyMeetingsQuery } from "@/queries/useMyMeetingsQuery";
import { useMeetingCheckinMutation } from "@/queries/useMeetingCheckinMutation";
import { MeetingCheckinDrawer } from "./MeetingCheckinDrawer";
import { MeetingFeedItem } from "./MeetingFeedItem";
import type { MemberMeetingFeedItem } from "@/api/types/groups";
import { useSubscribeSocketToGroups } from "@/hooks/useSubscribeSocketToGroups";

export function MyMeetingsTab() {
  const {
    items,
    isLoading,
    isError,
    errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyMeetingsQuery();

  const uniqueGroupIds = useMemo(() => {
    const groupIdSet = new Set<string>();
    items.forEach((item) => {
      groupIdSet.add(item.groupId);
    });
    return Array.from(groupIdSet);
  }, [items]);

  useSubscribeSocketToGroups(uniqueGroupIds);

  const [selectedMeetingForDrawer, setSelectedMeetingForDrawer] =
    useState<MemberMeetingFeedItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawerOpen = (meeting: MemberMeetingFeedItem) => {
    setSelectedMeetingForDrawer(meeting);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedMeetingForDrawer(null);
    }, 300);
  };

  const mutation = useMeetingCheckinMutation({
    meetingId: selectedMeetingForDrawer?.meetingId ?? "",
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "180px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="py-6 text-sm text-muted-foreground" role="status">
        Loading your meetings...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6">
        <p className="text-sm text-destructive" role="alert">
          {errorMessage ?? "Unable to load meetings."}
        </p>
        <button
          type="button"
          className="mt-3 text-sm underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-6 text-sm text-center text-muted-foreground space-y-1">
        <p>No meetings found yet.</p>
        <p>Your upcoming and past meetings will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 py-3">
        {items.map((item) => (
          <MeetingFeedItem
            key={item.meetingId}
            item={item}
            onCheckInClick={handleDrawerOpen}
          />
        ))}
        <div ref={sentinelRef} />
        {isFetchingNextPage && (
          <p className="text-sm text-muted-foreground">
            Loading more meetings...
          </p>
        )}
        {!hasNextPage && !isFetchingNextPage && items.length > 0 && (
          <p className="text-sm text-center text-muted-foreground py-3">
            You've reached the end of your meetings.
          </p>
        )}
      </div>
      <MeetingCheckinDrawer
        isOpen={isDrawerOpen}
        selectedMeeting={selectedMeetingForDrawer}
        isSubmitting={mutation.isPending}
        errorMessage={
          mutation.error instanceof Error ? mutation.error.message : null
        }
        onClose={handleDrawerClose}
        onSubmit={async (state) => {
          await mutation.mutateAsync({ state });
          handleDrawerClose();
        }}
      />
    </>
  );
}
