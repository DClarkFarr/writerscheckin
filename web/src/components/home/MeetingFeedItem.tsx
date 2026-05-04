import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatBookendDay,
  formatBookendMonthDay,
  formatBookendYear,
  formatDate,
} from "@/lib/dateFormat";
import type { MeetingDisplayTone, MyMeetingFeedItem } from "@/api/types/groups";
import IconEyeLock from "~icons/mdi/eye-lock";
import IconClockTimeThree from "~icons/mdi/clock-time-three";

import IconCheckCircle from "~icons/mdi/check-circle";
import IconBookOpenPageVariant from "~icons/mdi/book-open-page-variant";
import IconCloseCircle from "~icons/mdi/close-circle";

interface MeetingFeedItemProps {
  item: MyMeetingFeedItem;
  onCheckInClick?: (item: MyMeetingFeedItem) => void;
}

const getBookendAndBorderColor = (displayTone: string): string => {
  switch (displayTone) {
    case "blue":
      return "border-blue-500 bg-blue-50";
    case "red":
      return "border-red-500 bg-red-50";
    case "gray":
      return "border-gray-300 bg-gray-50";
    default:
      return "border-gray-300 bg-gray-50";
  }
};

const getBookendColor = (displayTone: string): string => {
  switch (displayTone) {
    case "blue":
      return "bg-blue-500 text-white";
    case "red":
      return "bg-red-500 text-white";
    case "gray":
      return "bg-gray-300 text-gray-700";
    default:
      return "bg-gray-300 text-gray-700";
  }
};

const getButtonColors = (displayTone: string) => {
  switch (displayTone) {
    case "blue":
      return "bg-blue-500 hover:bg-blue-600 text-white";
    case "red":
      return "bg-red-500 hover:bg-red-600 text-white";
    case "gray":
      return "bg-gray-300 hover:bg-gray-400 text-gray-700";
    default:
      return "bg-gray-300 hover:bg-gray-400 text-gray-700";
  }
};

const getGroupStartTime = (occursAt: string): string => {
  return formatDate(occursAt, "h:mm a");
};
export const MeetingFeedItem = ({
  item,
  onCheckInClick,
}: MeetingFeedItemProps) => {
  let displayTone: MeetingDisplayTone = "gray";
  if (item.segment === "upcoming") {
    displayTone = item.userCheckinState === "not_attending" ? "red" : "blue";
  }
  const borderColorClass = getBookendAndBorderColor(displayTone);
  const bookendColorClass = getBookendColor(displayTone);
  const buttonColorClass = getButtonColors(displayTone);

  const groupStartTime = getGroupStartTime(item.occursAt);

  return (
    <Card className={`border-l-4 blabla p-0! ${borderColorClass}`} size="sm">
      <div className="flex">
        {/* Left Date Bookend */}
        <div
          className={`${bookendColorClass} flex flex-col items-center justify-center px-3 py-4 font-bold text-center`}
          style={{ minWidth: "60px" }}
        >
          <div className="text-lg leading-tight">
            {formatBookendDay(item.occursAt)}
          </div>
          <div className="text-xs leading-tight">
            {formatBookendMonthDay(item.occursAt)}
          </div>
          <div className="text-xs leading-tight">
            {formatBookendYear(item.occursAt)}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-3">
          <div className="space-y-2">
            {/* Title and Admin Badge */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm leading-tight max-w-xs">
                {item.name}
              </h3>
              {item.showAdminOnlyBadge && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs whitespace-nowrap"
                >
                  <IconEyeLock />
                  <span>admin only</span>
                </Badge>
              )}
            </div>

            {/* Group Name and Counts */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-1 text-base text-gray-700">
                <IconClockTimeThree />
                {groupStartTime}
              </p>
              <p>
                Attending:{" "}
                <b className="text-foreground">{item.attendingCount}</b> |
                Reading: <b className="text-foreground">{item.readingCount}</b>
              </p>
            </div>

            {/* Status Badges */}
            {item.userCheckinState !== "none" && (
              <div className="flex gap-2 flex-wrap">
                {item.userCheckinState === "attending" && (
                  <Badge
                    variant="outline"
                    className="text-sm bg-green-100 border-green-300 text-green-700"
                  >
                    <span>
                      <IconCheckCircle className="text-green-700" />
                    </span>
                    <span>you are coming</span>
                  </Badge>
                )}
                {item.userCheckinState === "reading" && (
                  <Badge
                    variant="outline"
                    className="text-sm bg-blue-100 border-blue-300 text-blue-700"
                  >
                    <span>
                      <IconBookOpenPageVariant className="text-blue-700" />
                    </span>
                    <span>you are reading</span>
                  </Badge>
                )}
                {item.userCheckinState === "not_attending" && (
                  <Badge
                    variant="outline"
                    className="text-sm bg-red-100 border-red-300 text-red-700"
                  >
                    <span>
                      <IconCloseCircle className="text-red-700" />
                    </span>
                    <span>you are not coming</span>
                  </Badge>
                )}
              </div>
            )}

            {/* Check-In Button */}
            {item.canCheckin && (
              <Button
                size="sm"
                className={`w-full mt-2 ${buttonColorClass}`}
                onClick={() => onCheckInClick?.(item)}
              >
                {item.userCheckinState === "none"
                  ? "Check In"
                  : "Update Check-In"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
