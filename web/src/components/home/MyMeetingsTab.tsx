import { useEffect, useRef, useState } from "react";
import { useMyMeetingsQuery } from "@/queries/useMyMeetingsQuery";
import { useMeetingCheckinMutation } from "@/queries/useMeetingCheckinMutation";
import { MeetingCheckinDrawer } from "./MeetingCheckinDrawer";
import { MeetingFeedItem } from "./MeetingFeedItem";
import type { MyMeetingFeedItem } from "@/api/types/groups";

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
  } = useMyMeetingsQuery({ enabled: true });

  const [selectedMeetingForDrawer, setSelectedMeetingForDrawer] =
    useState<MyMeetingFeedItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDrawerOpen = (meeting: MyMeetingFeedItem) => {
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
      <div className="py-6 text-sm text-muted-foreground">
        Loading meetings...
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
      <div className="py-6 text-sm text-muted-foreground">
        No meetings found yet.
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
          <p className="text-sm text-muted-foreground py-3">
            You've reached the end of your meetings.
          </p>
        )}
      </div>
      <MeetingCheckinDrawer
        isOpen={isDrawerOpen}
        selectedMeeting={selectedMeetingForDrawer}
        isSubmitting={mutation.isPending}
        onClose={handleDrawerClose}
        onSubmit={async (state) => {
          await mutation.mutateAsync({ state });
          handleDrawerClose();
        }}
      />
    </>
  );
}
