import { getUserById, updateUserPasswordById } from "../models/users";
import {
  AuthError,
  type AuthUserResponse,
  validateAuthPasswordRules,
  ValidationError,
} from "./authService";
import {
  type ChangePasswordForSessionInput,
  type ChangePasswordForSessionResponse,
  type UpdateProfileForSessionInput,
  type UpdateProfileForSessionResponse,
} from "./contracts/userProfile";
import { parseProfileNameUpdates, updateUserById } from "./userService";
import { hashPassword, verifyPassword } from "../utils/passwords";
import { invalidateOtherSessionsForUser } from "./sessionService";
import { recordAuditEvent } from "../utils/audit";

const toAuthUser = (user: {
  _id: { toHexString(): string };
  email: string;
  firstName: string;
  lastName: string;
}): AuthUserResponse => ({
  id: user._id.toHexString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});

const requireStringField = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(field, `${field} is required`);
  }

  return value;
};

const assertEmailNotProvided = (email: unknown): void => {
  if (email !== undefined) {
    throw new ValidationError("email", "Email updates are not permitted");
  }
};

const getSessionUser = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
};

export const updateProfileForSessionUser = async (
  userId: string,
  input: UpdateProfileForSessionInput,
): Promise<UpdateProfileForSessionResponse> => {
  assertEmailNotProvided(input.email);

  const updates = parseProfileNameUpdates({
    firstName: input.firstName,
    lastName: input.lastName,
  });

  const updatedUser = await updateUserById(userId, updates);
  if (!updatedUser) {
    throw new AuthError("Unauthorized", 401);
  }

  return { user: toAuthUser(updatedUser) };
};

export const changePasswordForSessionUser = async (
  userId: string,
  input: ChangePasswordForSessionInput,
  currentSessionToken: string,
  ipAddress?: string,
): Promise<ChangePasswordForSessionResponse> => {
  assertEmailNotProvided(input.email);

  const currentPassword = requireStringField(
    input.currentPassword,
    "currentPassword",
  );
  const newPassword = validateAuthPasswordRules(input.newPassword);
  const newPasswordConfirm = requireStringField(
    input.newPasswordConfirm,
    "newPasswordConfirm",
  );

  if (newPassword !== newPasswordConfirm) {
    throw new ValidationError(
      "newPasswordConfirm",
      "New password and confirmation do not match",
    );
  }

  const user = await getSessionUser(userId);
  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    throw new AuthError("Current password is incorrect", 401);
  }

  const isReusedPassword = await verifyPassword(newPassword, user.passwordHash);
  if (isReusedPassword) {
    throw new ValidationError(
      "newPassword",
      "New password must be different from your current password",
    );
  }

  const passwordHash = await hashPassword(newPassword);
  const updatedUser = await updateUserPasswordById(userId, passwordHash);

  if (!updatedUser) {
    throw new AuthError("Unauthorized", 401);
  }

  recordAuditEvent({
    action: "password_changed",
    userId: updatedUser._id.toHexString(),
    email: updatedUser.email,
    ...(ipAddress ? { ipAddress } : {}),
  });

  await invalidateOtherSessionsForUser(userId, currentSessionToken);

  return {
    message: "Password updated successfully.",
  };
};
