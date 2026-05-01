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
