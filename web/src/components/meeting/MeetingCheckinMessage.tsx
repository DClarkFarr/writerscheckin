import type { MemberMeetingFeedItem } from "@/api/types/groups";
import {
  DISPLAY_DATE_FORMAT,
  DISPLAY_TIME_FORMAT,
  formatDate,
  parseDateStrict,
} from "@/lib/dateFormat";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { CountdownText } from "../helpers/CountdownText";

export type MeetingCheckinMessageProps = {
  item: Pick<
    MemberMeetingFeedItem,
    | "checkinClosesAt"
    | "occursAt"
    | "publishHoursBefore"
    | "status"
    | "cancelledAt"
  >;
};
export const MeetingCheckinMessage = ({ item }: MeetingCheckinMessageProps) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const closesAt = useMemo(
    () => parseDateStrict(item.checkinClosesAt),
    [item.checkinClosesAt],
  );

  const publishAt = useMemo(() => {
    return dayjs(item.occursAt).subtract(item.publishHoursBefore ?? 0, "hour");
  }, [item.occursAt, item.publishHoursBefore]);

  useEffect(() => {
    if (!closesAt) {
      return;
    }

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
  }, [item.checkinClosesAt, closesAt]);

  if (!closesAt || !currentTime) {
    return "Check-in period end time unavailable.";
  }

  if (item.cancelledAt) {
    return "This meeting has been cancelled.";
  }

  if (publishAt.isAfter(currentTime)) {
    if (item.status === "published") {
      return "Select your RSVP status";
    }
    return (
      <CountdownText targetTime={publishAt.toDate()}>
        <span className="inline-block py-2 leading-1">Check-in starts in </span>
      </CountdownText>
    );
  }

  if (item.status === "published") {
    const dateText = formatDate(closesAt, DISPLAY_DATE_FORMAT);
    const timeText = formatDate(closesAt, DISPLAY_TIME_FORMAT);

    if (closesAt.isAfter(currentTime)) {
      return (
        <CountdownText targetTime={closesAt.toDate()}>
          <span className="inline-block py-2 leading-1">
            Check-in period ends in{" "}
          </span>
        </CountdownText>
      );
    } else {
      return `RSVP period has closed at ${dateText} ${timeText}`;
    }
  }

  return null;
};
