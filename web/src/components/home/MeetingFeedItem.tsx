import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatBookendDay,
  formatBookendMonthDay,
  formatBookendYear,
} from "@/lib/dateFormat";
import type { MyMeetingFeedItem } from "@/api/types/groups";

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

const getButtonVariant = (
  displayTone: string,
): "outline" | "default" | "secondary" => {
  switch (displayTone) {
    case "blue":
      return "default";
    case "red":
      return "secondary";
    case "gray":
      return "outline";
    default:
      return "outline";
  }
};

export const MeetingFeedItem = ({
  item,
  onCheckInClick,
}: MeetingFeedItemProps) => {
  const borderColorClass = getBookendAndBorderColor(item.displayTone);
  const bookendColorClass = getBookendColor(item.displayTone);
  const buttonVariant = getButtonVariant(item.displayTone);

  return (
    <Card
      className={`overflow-hidden border-l-4 ${borderColorClass}`}
      size="sm"
    >
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
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 3L21 21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.88 5.09C10.57 4.89 11.28 4.79 12 4.79C16.45 4.79 20.27 8.13 22 12C21.52 13.08 20.85 14.08 20.04 14.94"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.61 6.61C4.62 7.93 3.08 9.82 2 12C3.73 15.87 7.55 19.21 12 19.21C13.87 19.21 15.65 18.62 17.13 17.59"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  admin only
                </Badge>
              )}
            </div>

            {/* Group Name and Counts */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{item.groupName}</p>
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
                  <Badge variant="outline" className="text-xs">
                    you are coming
                  </Badge>
                )}
                {item.userCheckinState === "reading" && (
                  <Badge variant="outline" className="text-xs">
                    you are reading
                  </Badge>
                )}
                {item.userCheckinState === "not_attending" && (
                  <Badge variant="outline" className="text-xs">
                    you are not coming
                  </Badge>
                )}
              </div>
            )}

            {/* Check-In Button */}
            {item.canCheckin && (
              <Button
                size="sm"
                variant={buttonVariant}
                className="w-full mt-2"
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
