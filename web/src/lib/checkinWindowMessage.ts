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
