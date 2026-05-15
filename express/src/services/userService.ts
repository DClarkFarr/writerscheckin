import { ObjectId } from "mongodb";
import {
  createUser as createUserModel,
  getUserByEmail,
  UpdateUserInput,
  UserDefinition,
  UserDocument,
  updateUserById as updateUserByIdModel,
} from "../models/users";
import { ensureObjectId } from "../models/types";
import { ValidationError } from "./authService";

export const normalizeUserName = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const validateUserName = (
  value: unknown,
  field: "firstName" | "lastName",
): string => {
  if (typeof value !== "string") {
    throw new ValidationError(field, `${field} is required`);
  }

  const normalized = normalizeUserName(value);
  if (!normalized) {
    throw new ValidationError(field, `${field} is required`);
  }

  if (normalized.length > 80) {
    throw new ValidationError(field, `${field} is too long`);
  }

  return normalized;
};

export interface ProfileNameUpdatesInput {
  firstName?: unknown;
  lastName?: unknown;
}

export interface ProfileNameUpdates {
  firstName?: string;
  lastName?: string;
}

export const parseProfileNameUpdates = (
  input: ProfileNameUpdatesInput,
): ProfileNameUpdates => {
  const updates: ProfileNameUpdates = {};

  if (input.firstName !== undefined) {
    updates.firstName = validateUserName(input.firstName, "firstName");
  }

  if (input.lastName !== undefined) {
    updates.lastName = validateUserName(input.lastName, "lastName");
  }

  if (!updates.firstName && !updates.lastName) {
    throw new ValidationError(
      "firstName",
      "At least one name field is required",
    );
  }

  return updates;
};

const assertEmailAvailable = async (
  email: string,
  excludeUserId?: string,
): Promise<void> => {
  const existing = await getUserByEmail(email);
  if (!existing) {
    return;
  }

  if (excludeUserId && existing._id.toHexString() === excludeUserId) {
    return;
  }

  throw new Error("Email already in use");
};

export const createUser = async (
  input: UserDefinition,
): Promise<UserDocument> => {
  await assertEmailAvailable(input.email);
  return createUserModel(input);
};

export const updateUserById = async (
  id: string | ObjectId,
  updates: UpdateUserInput,
): Promise<UserDocument | null> => {
  if (updates.email) {
    const userId = ensureObjectId(id, "userId").toHexString();
    await assertEmailAvailable(updates.email, userId);
  }

  return updateUserByIdModel(id, updates);
};
