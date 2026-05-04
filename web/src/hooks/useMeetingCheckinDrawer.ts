import { useState, useCallback } from "react";
import type { MyMeetingFeedItem } from "@/api/types/groups";

interface UseMeetingCheckinDrawerProps {
  onCheckinSubmit?: (
    meetingId: string,
    state: "attending" | "reading" | "not_attending",
  ) => Promise<void>;
}

export const useMeetingCheckinDrawer = ({
  onCheckinSubmit,
}: UseMeetingCheckinDrawerProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MyMeetingFeedItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDrawer = useCallback((meeting: MyMeetingFeedItem) => {
    setSelectedMeeting(meeting);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Clear selection after closing animation
    setTimeout(() => {
      setSelectedMeeting(null);
    }, 300);
  }, []);

  const submitCheckin = useCallback(
    async (state: "attending" | "reading" | "not_attending") => {
      if (!selectedMeeting) return;

      setIsSubmitting(true);
      try {
        await onCheckinSubmit?.(selectedMeeting.meetingId, state);
        closeDrawer();
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedMeeting, onCheckinSubmit, closeDrawer],
  );

  return {
    isOpen,
    selectedMeeting,
    isSubmitting,
    openDrawer,
    closeDrawer,
    submitCheckin,
  };
};
