import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MemberMeetingFeedItem } from "@/api/types/groups";
import {
  canCheckInToMemberMeeting,
  getMemberMeetingAttendanceState,
} from "@/hooks/useMemberMeetingDerivedState";
import { parseDateStrict } from "@/lib/dateFormat";
import { formatCheckinWindowMessage } from "@/lib/checkinWindowMessage";

interface MeetingCheckinDrawerProps {
  isOpen: boolean;
  selectedMeeting: MemberMeetingFeedItem | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (state: "attending" | "reading" | "not_attending") => Promise<void>;
}

// Status hierarchy: "reading" (3) > "attending" (2) > "skipping" (1) > "invited" (0)
const getStatusHierarchy = (status: string | null | undefined): number => {
  const hierarchy: Record<string, number> = {
    reading: 3,
    attending: 2,
    skipping: 1,
    invited: 0,
  };
  return hierarchy[status ?? ""] ?? 0;
};

const canDowngradeTo = (
  currentStatus: string | null | undefined,
  targetStatus: string,
): boolean => {
  return getStatusHierarchy(targetStatus) < getStatusHierarchy(currentStatus);
};

export const MeetingCheckinDrawer = ({
  isOpen,
  selectedMeeting,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: MeetingCheckinDrawerProps) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    if (!isOpen || !selectedMeeting?.checkinClosesAt) {
      return;
    }

    const closesAt = parseDateStrict(selectedMeeting.checkinClosesAt);
    if (!closesAt) {
      return;
    }

    (() => setCurrentTime(new Date()))();

    if (!closesAt.isAfter(new Date())) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (!closesAt.isAfter(now)) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, selectedMeeting?.checkinClosesAt]);

  if (!selectedMeeting) {
    return null;
  }

  const attendanceState = getMemberMeetingAttendanceState(selectedMeeting);
  const canCheckin = canCheckInToMemberMeeting(selectedMeeting);
  const meetingTitle = selectedMeeting.name.trim() || "Untitled meeting";
  const isCheckinCutoffClosed =
    selectedMeeting.isCheckinClosedByCuttoff === true;

  // Determine if the period is actually closed
  const closesAt = selectedMeeting.checkinClosesAt
    ? parseDateStrict(selectedMeeting.checkinClosesAt)
    : null;
  const isPeriodClosed = closesAt ? !closesAt.isAfter(currentTime) : false;

  const checkinWindowMessage = selectedMeeting.checkinClosesAt
    ? formatCheckinWindowMessage({
        checkinClosesAt: selectedMeeting.checkinClosesAt,
        now: currentTime,
      })
    : (selectedMeeting.checkinPeriodMessage ??
      "Check-in period end time unavailable.");

  const helperText = canCheckin
    ? "How are you planning to attend this meeting?"
    : isCheckinCutoffClosed
      ? "Check-in is closed because the cutoff time has passed."
      : "Check-in is unavailable for this meeting right now.";

  const canClickButton = (buttonStatus: string): boolean => {
    if (!isPeriodClosed) {
      return !isSubmitting && canCheckin;
    }

    // Period is closed - only allow downgrades
    return (
      !isSubmitting &&
      (buttonStatus === "attending"
        ? canDowngradeTo(attendanceState, "attending")
        : buttonStatus === "reading"
          ? canDowngradeTo(attendanceState, "reading")
          : buttonStatus === "skipping"
            ? canDowngradeTo(attendanceState, "skipping")
            : false)
    );
  };

  const getButtonDisabledReason = (buttonStatus: string): string | null => {
    if (!isPeriodClosed) {
      return null;
    }

    // Period is closed
    if (
      buttonStatus === "attending" &&
      !canDowngradeTo(attendanceState, "attending")
    ) {
      return "Check-in period has closed. Contact the group admin to upgrade your status.";
    }

    if (
      buttonStatus === "reading" &&
      !canDowngradeTo(attendanceState, "reading")
    ) {
      return "Check-in period has closed. Contact the group admin to upgrade your status.";
    }

    if (
      buttonStatus === "skipping" &&
      !canDowngradeTo(attendanceState, "skipping")
    ) {
      return "Check-in period has closed. Contact the group admin to upgrade your status.";
    }

    return null;
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left text-lg">
            {meetingTitle}
          </DrawerTitle>
          <DrawerDescription className="text-left">
            {helperText}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-3 mb-8">
          <p className="text-sm text-muted-foreground">
            {checkinWindowMessage}
          </p>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  attendanceState === "attending" ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => onSubmit("attending")}
                disabled={isSubmitting || !canClickButton("attending")}
              >
                <span className="text-sm font-medium">Attending</span>
              </Button>
            </TooltipTrigger>
            {getButtonDisabledReason("attending") && (
              <TooltipContent>
                <p>{getButtonDisabledReason("attending")}</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={attendanceState === "reading" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => onSubmit("reading")}
                disabled={isSubmitting || !canClickButton("reading")}
              >
                <span className="text-sm font-medium">Reading</span>
              </Button>
            </TooltipTrigger>
            {getButtonDisabledReason("reading") && (
              <TooltipContent>
                <p>{getButtonDisabledReason("reading")}</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  attendanceState === "skipping" ? "destructive" : "outline"
                }
                className="w-full justify-start"
                onClick={() => onSubmit("not_attending")}
                disabled={isSubmitting || !canClickButton("skipping")}
              >
                <span className="text-sm font-medium">Not Attending</span>
              </Button>
            </TooltipTrigger>
            {getButtonDisabledReason("skipping") && (
              <TooltipContent>
                <p>{getButtonDisabledReason("skipping")}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {!canCheckin && !isPeriodClosed && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You can still open the meeting to review the details even when
                check-in is closed.
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-2"
                    aria-label="Why check-in is disabled"
                  >
                    Why is check-in disabled?
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{helperText}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {isPeriodClosed && (
            <div className="space-y-2 border-l-2 border-amber-500 bg-amber-50 p-3 rounded">
              <p className="text-sm font-medium text-amber-900">
                Check-in period has ended
              </p>
              <p className="text-xs text-amber-800">
                You can only downgrade your status. To increase your status,
                contact the group admin.
              </p>
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
