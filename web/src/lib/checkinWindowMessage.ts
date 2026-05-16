import {
  DISPLAY_DATE_FORMAT,
  DISPLAY_TIME_FORMAT,
  formatCountdownHms,
  formatDate,
  parseDateStrict,
} from "@/lib/dateFormat";

type DateValue = string | number | Date | null | undefined;

export interface CheckinWindowMessageInput {
  checkinClosesAt: DateValue;
  now?: DateValue;
}

export type CheckinWindowUiState =
  | "pre-open"
  | "open"
  | "closed"
  | "unavailable";

export const resolveCheckinWindowUiState = (input: {
  canCheckin: boolean;
  isCheckinClosedByCuttoff?: boolean;
  isUpcomingMeeting: boolean;
}): CheckinWindowUiState => {
  if (input.canCheckin) {
    return "open";
  }

  if (input.isCheckinClosedByCuttoff) {
    return "closed";
  }

  if (input.isUpcomingMeeting) {
    return "pre-open";
  }

  return "unavailable";
};

export const getCheckinDisabledReason = (
  state: CheckinWindowUiState,
): string => {
  if (state === "pre-open") {
    return "Check-in starts soon.";
  }

  if (state === "closed") {
    return "Check-in is closed because the cutoff time has passed.";
  }

  return "Check-in is unavailable right now.";
};

export const getCheckinPrimaryButtonLabel = (
  state: CheckinWindowUiState,
): string => {
  if (state === "closed") {
    return "Check-in Closed";
  }

  return "Check-in starts soon";
};

export const formatCheckinWindowMessage = ({
  checkinClosesAt,
  now = new Date(),
}: CheckinWindowMessageInput): string => {
  const closesAt = parseDateStrict(checkinClosesAt);
  const current = parseDateStrict(now);

  if (!closesAt || !current) {
    return "Check-in period end time unavailable.";
  }

  const dateText = formatDate(closesAt, DISPLAY_DATE_FORMAT);
  const timeText = formatDate(closesAt, DISPLAY_TIME_FORMAT);

  if (!closesAt.isAfter(current)) {
    return `RSVP period has closed at ${dateText} ${timeText}`;
  }

  return `Check-in period ends in ${formatCountdownHms(closesAt, current)}`;
};
