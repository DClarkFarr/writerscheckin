import { ObjectId } from "mongodb";
import {
  createSession as createSessionModel,
  CreateSessionInput,
  endSessionsByUserId as endSessionsByUserIdModel,
  SessionDocument,
} from "../models/sessions";
import { getUserById } from "../models/users";

const assertUserExists = async (userId: string | ObjectId): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
};

export const createSession = async (
  input: CreateSessionInput,
): Promise<SessionDocument> => {
  await assertUserExists(input.userId);
  return createSessionModel(input);
};

export const endSessionsByUserId = async (
  userId: string | ObjectId,
): Promise<number> => {
  await assertUserExists(userId);
  return endSessionsByUserIdModel(userId);
};
