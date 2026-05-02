import { ensureAuthAttemptIndexes } from "./authAttempts";
import { ensureGroupMemberIndexes } from "./groupMembers";
import { ensureGroupMeetingIndexes } from "./groupMeetings";
import { ensureGroupIndexes } from "./groups";
import { ensureMeetingAttendeeIndexes } from "./meetingAttendees";
import { ensureMeetingAttendanceLogIndexes } from "./meetingAttendanceLogs";
import { ensurePasswordResetIndexes } from "./passwordResets";
import { ensureSessionIndexes } from "./sessions";
import { ensureUserIndexes } from "./users";

export const ensureModelIndexes = async (): Promise<void> => {
  await ensureUserIndexes();
  await ensureSessionIndexes();
  await ensurePasswordResetIndexes();
  await ensureAuthAttemptIndexes();

  await ensureGroupIndexes();
  await ensureGroupMemberIndexes();
  await ensureGroupMeetingIndexes();
  await ensureMeetingAttendeeIndexes();
  await ensureMeetingAttendanceLogIndexes();
};
