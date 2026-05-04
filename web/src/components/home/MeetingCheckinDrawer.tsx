import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { MyMeetingFeedItem } from "@/api/types/groups";

interface MeetingCheckinDrawerProps {
  isOpen: boolean;
  selectedMeeting: MyMeetingFeedItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (state: "attending" | "reading" | "not_attending") => Promise<void>;
}

export const MeetingCheckinDrawer = ({
  isOpen,
  selectedMeeting,
  isSubmitting,
  onClose,
  onSubmit,
}: MeetingCheckinDrawerProps) => {
  if (!selectedMeeting) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">
            {selectedMeeting.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSubmit("attending")}
            disabled={isSubmitting}
          >
            <span className="text-sm font-medium">Attending</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSubmit("reading")}
            disabled={isSubmitting}
          >
            <span className="text-sm font-medium">Reading</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSubmit("not_attending")}
            disabled={isSubmitting}
          >
            <span className="text-sm font-medium">Not Attending</span>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
