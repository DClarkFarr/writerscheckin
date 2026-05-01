import {
  AuthAttemptType,
  createAuthAttempt,
  getAuthAttempt,
  updateAuthAttempt,
} from "../models/authAttempts";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const buildWindowExpiry = (): Date =>
  new Date(Date.now() + WINDOW_MINUTES * 60 * 1000);

export const assertAuthAttemptAllowed = async (
  identifier: string,
  ipAddress: string,
  type: AuthAttemptType,
): Promise<void> => {
  const attempt = await getAuthAttempt(identifier, ipAddress, type);
  if (!attempt) {
    return;
  }

  if (attempt.windowExpiresAt <= new Date()) {
    return;
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please try again later.");
  }
};

export const recordAuthAttempt = async (
  identifier: string,
  ipAddress: string,
  type: AuthAttemptType,
): Promise<void> => {
  const existing = await getAuthAttempt(identifier, ipAddress, type);
  const windowExpiresAt = buildWindowExpiry();

  if (!existing || existing.windowExpiresAt <= new Date()) {
    await createAuthAttempt({
      identifier,
      ipAddress,
      type,
      count: 1,
      windowExpiresAt,
    });
    return;
  }

  await updateAuthAttempt(identifier, ipAddress, type, {
    count: existing.count + 1,
    windowExpiresAt,
  });
};

export const resetAuthAttempt = async (
  identifier: string,
  ipAddress: string,
  type: AuthAttemptType,
): Promise<void> => {
  const existing = await getAuthAttempt(identifier, ipAddress, type);
  if (!existing) {
    return;
  }

  await updateAuthAttempt(identifier, ipAddress, type, {
    count: 0,
    windowExpiresAt: new Date(),
  });
};
