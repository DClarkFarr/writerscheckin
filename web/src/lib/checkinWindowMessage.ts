import {
  DISPLAY_DATE_FORMAT,
  DISPLAY_TIME_FORMAT,
  formatCountdownHms,
  formatDate,
  isSameCalendarDay,
  parseDateStrict,
} from "@/lib/dateFormat";

type DateValue = string | number | Date | null | undefined;

export interface CheckinWindowMessageInput {
  checkinClosesAt: DateValue;
  now?: DateValue;
}

export const formatCheckinWindowMessage = ({
  checkinClosesAt,
  now = new Date(),
}: CheckinWindowMessageInput): string => {
  const closesAt = parseDateStrict(checkinClosesAt);
  const current = parseDateStrict(now);

  if (!closesAt || !current) {
    return "Check-in period end time unavailable.";
  }

  if (isSameCalendarDay(closesAt, current)) {
    return `Check-in period ends in ${formatCountdownHms(closesAt, current)}`;
  }

  const dateText = formatDate(closesAt, DISPLAY_DATE_FORMAT);
  const timeText = formatDate(closesAt, DISPLAY_TIME_FORMAT);
  return `Check-in period ends ${dateText} at ${timeText}`;
};
