import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatBookendDay,
  formatBookendMonthDay,
  formatBookendYear,
  formatDate,
  formatTimeUntil,
} from "@/lib/dateFormat";
import type {
  MeetingDisplayTone,
  MemberMeetingFeedItem,
} from "@/api/types/groups";
import {
  getMemberMeetingAttendanceState,
  useMemberMeetingDerivedState,
} from "@/hooks/useMemberMeetingDerivedState";
import { usePublishMeetingMutation } from "@/queries/usePublishMeetingMutation";
import { useCancelMeetingMutation } from "@/queries/useCancelMeetingMutation";
import { myMeetingsQueryKey } from "@/queries/useMyMeetingsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import IconEyeLock from "~icons/mdi/eye-lock";
import IconClockTimeThree from "~icons/mdi/clock-time-three";
import IconDotsVertical from "~icons/mdi/dots-vertical";
import IconPencil from "~icons/mdi/pencil";
import IconCheckCircle from "~icons/mdi/check-circle";
import IconBookOpenPageVariant from "~icons/mdi/book-open-page-variant";
import IconCloseCircle from "~icons/mdi/close-circle";
import IconEye from "~icons/mdi/eye";
import { Link, useNavigate } from "@tanstack/react-router";
import { ButtonGroup } from "../ui/button-group";
import { Alert } from "../ui/alert";

interface MeetingFeedItemProps {
  item: MemberMeetingFeedItem;
  onCheckInClick?: (item: MemberMeetingFeedItem) => void;
}

const getBookendAndBorderColor = (
  displayTone: string,
  isCancelled?: boolean,
): string => {
  if (isCancelled) {
    return "border-dashed border-rose-700 bg-gray-200";
  }
  switch (displayTone) {
    case "blue":
      return "border-blue-500";
    case "red":
      return "border-red-500";
    case "gray":
      return "border-gray-300";
    default:
      return "border-gray-300";
  }
};

const getBookendColor = (
  displayTone: string,
  isCancelled?: boolean,
): string => {
  if (isCancelled) {
    return "bg-rose-500 text-white";
  }
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
  const parsedOccursAt = new Date(occursAt);

  if (Number.isNaN(parsedOccursAt.getTime())) {
    return "Time TBD";
  }

  return formatDate(occursAt, "h:mm a");
};

const getTimeUntilCheckin = (
  isUpcoming: boolean,
  checkinAt: string,
): string => {
  if (!isUpcoming) return "";
  return formatTimeUntil(checkinAt);
};

const getMeetingTitle = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Untitled meeting";
};

const getSafeCount = (value: number | undefined): number => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
};
export const MeetingFeedItem = ({
  item,
  onCheckInClick,
}: MeetingFeedItemProps) => {
  const queryClient = useQueryClient();

  const isCancelled = !!item.cancelledAt;

  const derivedState = useMemberMeetingDerivedState(item);
  const displayTone: MeetingDisplayTone = derivedState.displayTone;
  const userCheckinState = getMemberMeetingAttendanceState(item);
  const borderColorClass = getBookendAndBorderColor(displayTone, isCancelled);
  const bookendColorClass = getBookendColor(displayTone, isCancelled);
  const buttonColorClass = getButtonColors(displayTone);
  const timeUntilCheckin = getTimeUntilCheckin(
    derivedState.meetingTimeState === "upcoming",
    derivedState.toBePublishedAt,
  );
  const groupStartTime = getGroupStartTime(item.occursAt);

  const meetingTitle = getMeetingTitle(item.name);
  const attendingCount = getSafeCount(item.counts?.attending);
  const readingCount = getSafeCount(item.counts?.reading);
  const hasValidOccursAt = !Number.isNaN(new Date(item.occursAt).getTime());
  const isUpcomingMeeting = derivedState.meetingTimeState === "upcoming";
  const canPublishFromMenu =
    derivedState.canEdit && isUpcomingMeeting && item.status === "draft";
  const canCancelFromMenu =
    derivedState.canEdit && isUpcomingMeeting && item.status === "published";

  const navigate = useNavigate();
  const publishMutation = usePublishMeetingMutation({
    groupId: item.groupId,
    meetingId: item.meetingId,
  });
  const cancelMutation = useCancelMeetingMutation({
    groupId: item.groupId,
    meetingId: item.meetingId,
  });
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handlePublishMeeting = async () => {
    await publishMutation.mutateAsync();
    await queryClient.invalidateQueries({ queryKey: myMeetingsQueryKey() });
  };

  const handleCancelMeeting = async () => {
    if (cancelMutation.isPending) {
      return;
    }

    await cancelMutation.mutateAsync();
    setIsCancelDialogOpen(false);
  };

  return (
    <Card className={`p-0! border-2 ${borderColorClass}`} size="sm">
      <div className="flex">
        {/* Left Date Bookend */}
        <div
          className={`${bookendColorClass} flex flex-col items-center justify-center px-3 py-4 font-bold text-center`}
          style={{ minWidth: "60px" }}
        >
          {hasValidOccursAt ? (
            <>
              <div className="text-lg leading-tight">
                {formatBookendDay(item.occursAt)}
              </div>
              <div className="text-xs leading-tight">
                {formatBookendMonthDay(item.occursAt)}
              </div>
              <div className="text-xs leading-tight">
                {formatBookendYear(item.occursAt)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm leading-tight">Date</div>
              <div className="text-xs leading-tight">TBD</div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-3">
          <div className="space-y-2">
            {/* Title and Admin Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="grow">
                <h3 className="font-medium text-sm leading-tight">
                  {meetingTitle}
                </h3>
              </div>
              <div className="flex gap-1">
                {derivedState.showAdminOnlyBadge && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 text-xs whitespace-nowrap"
                  >
                    <IconEyeLock />
                    <span>admin only</span>
                  </Badge>
                )}

                <ButtonGroup>
                  {isUpcomingMeeting && derivedState.canEdit ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/groups/$groupId/meetings/$meetingId/edit"
                          params={{
                            groupId: item.groupId,
                            meetingId: item.meetingId,
                          }}
                        >
                          <Button type="button" size="icon" variant="ghost">
                            <IconPencil />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit meeting</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/groups/$groupId/meetings/$meetingId/view"
                          params={{
                            groupId: item.groupId,
                            meetingId: item.meetingId,
                          }}
                        >
                          <Button type="button" size="icon" variant="ghost">
                            <IconEye />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View meeting</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {derivedState.canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Meeting actions"
                        >
                          <IconDotsVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {isUpcomingMeeting ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              navigate({
                                to: "/groups/$groupId/meetings/$meetingId/view",
                                params: {
                                  groupId: item.groupId,
                                  meetingId: item.meetingId,
                                },
                              })
                            }
                          >
                            View meeting
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() =>
                              navigate({
                                to: "/groups/$groupId/meetings/$meetingId/edit",
                                params: {
                                  groupId: item.groupId,
                                  meetingId: item.meetingId,
                                },
                              })
                            }
                          >
                            Edit meeting
                          </DropdownMenuItem>
                        )}
                        {canPublishFromMenu && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={publishMutation.isPending}
                              onSelect={() => {
                                void handlePublishMeeting();
                              }}
                            >
                              {publishMutation.isPending
                                ? "Publishing..."
                                : "Publish meeting"}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canCancelFromMenu && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={cancelMutation.isPending}
                              onSelect={() => {
                                setIsCancelDialogOpen(true);
                              }}
                            >
                              {cancelMutation.isPending
                                ? "Cancelling..."
                                : "Cancel meeting"}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </ButtonGroup>
              </div>
            </div>

            {/* Group Name and Counts */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-1 text-base text-gray-700">
                <IconClockTimeThree />
                {groupStartTime}
              </p>
              <p>
                Attending: <b className="text-foreground">{attendingCount}</b> |
                Reading: <b className="text-foreground">{readingCount}</b>
              </p>
            </div>

            {/* Status Badges */}
            {userCheckinState !== "none" && (
              <div className="flex gap-2 flex-wrap">
                {userCheckinState === "attending" && (
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
                {userCheckinState === "reading" && (
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
                {userCheckinState === "not_attending" && (
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
            {!isCancelled &&
              derivedState.meetingTimeState === "upcoming" &&
              !derivedState.canCheckin && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full mt-2 border-gray-500`}
                  disabled
                >
                  Check-in starts {timeUntilCheckin}
                </Button>
              )}
            {!isCancelled && derivedState.canCheckin && (
              <Button
                size="sm"
                className={`w-full mt-2 ${buttonColorClass}`}
                onClick={() => onCheckInClick?.(item)}
              >
                {userCheckinState === "none" ? "Check In" : "Update Check-In"}
              </Button>
            )}

            {isCancelled && (
              <Alert variant="destructive" className="mt-2">
                <p>This meeting has been cancelled.</p>
              </Alert>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this meeting?</DialogTitle>
            <DialogDescription>
              Members who RSVP'd will receive a cancellation notification. This
              meeting will become non-editable and check-in will be disabled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep Meeting
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void handleCancelMeeting();
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
