import { Button } from "@/components/ui/button";
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
import { formatCheckinWindowMessage } from "@/lib/checkinWindowMessage";

interface MeetingCheckinDrawerProps {
  isOpen: boolean;
  selectedMeeting: MemberMeetingFeedItem | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (state: "attending" | "reading" | "not_attending") => Promise<void>;
}

export const MeetingCheckinDrawer = ({
  isOpen,
  selectedMeeting,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: MeetingCheckinDrawerProps) => {
  if (!selectedMeeting) {
    return null;
  }

  const attendanceState = getMemberMeetingAttendanceState(selectedMeeting);
  const canCheckin = canCheckInToMemberMeeting(selectedMeeting);
  const meetingTitle = selectedMeeting.name.trim() || "Untitled meeting";
  const isCheckinCutoffClosed =
    selectedMeeting.isCheckinClosedByCuttoff === true;
  const checkinWindowMessage =
    selectedMeeting.checkinPeriodMessage ??
    (selectedMeeting.checkinClosesAt
      ? formatCheckinWindowMessage({
          checkinClosesAt: selectedMeeting.checkinClosesAt,
        })
      : "Check-in period end time unavailable.");
  const helperText = canCheckin
    ? "How are you planning to attend this meeting?"
    : isCheckinCutoffClosed
      ? "Check-in is closed because the cutoff time has passed."
      : "Check-in is unavailable for this meeting right now.";

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

          <Button
            variant={attendanceState === "attending" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onSubmit("attending")}
            disabled={isSubmitting || !canCheckin}
          >
            <span className="text-sm font-medium">Attending</span>
          </Button>

          <Button
            variant={attendanceState === "reading" ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onSubmit("reading")}
            disabled={isSubmitting || !canCheckin}
          >
            <span className="text-sm font-medium">Reading</span>
          </Button>

          <Button
            variant={attendanceState === "skipping" ? "destructive" : "outline"}
            className="w-full justify-start"
            onClick={() => onSubmit("not_attending")}
            disabled={isSubmitting || !canCheckin}
          >
            <span className="text-sm font-medium">Not Attending</span>
          </Button>

          {!canCheckin && (
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
