import { Collection, ObjectId } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  BaseModelBlueprint,
  createTimestamps,
  ensureObjectId,
  ModelBlueprint,
  ModelDocument,
  ModelInsertInput,
  touchTimestamps,
} from "./types";

export interface UserDefinition extends BaseModelBlueprint {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  passwordChangedAt: Date;
}

export type UserBlueprint = ModelBlueprint<UserDefinition>;
export type UserDocument = ModelDocument<UserDefinition>;

export const getUsersCollection = (): Collection<UserDocument> =>
  getCollection<UserDocument>(COLLECTIONS.users);

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const ensureUserIndexes = async (): Promise<void> => {
  const collection = getUsersCollection();
  await collection.createIndex({ email: 1 }, { unique: true });
};

export const getUserById = async (
  id: string | ObjectId,
): Promise<UserDocument | null> => {
  const collection = getUsersCollection();
  return collection.findOne({ _id: ensureObjectId(id, "userId") });
};

export const getUserByEmail = async (
  email: string,
): Promise<UserDocument | null> => {
  const collection = getUsersCollection();
  return collection.findOne({ email: normalizeEmail(email) });
};

export interface ListUsersOptions {
  limit?: number;
}

export const listUsers = async (
  options: ListUsersOptions = {},
): Promise<UserDocument[]> => {
  const collection = getUsersCollection();
  const limit = options.limit ?? 50;

  return collection.find({}).limit(limit).toArray();
};

export const listUsersByIds = async (
  ids: Array<string | ObjectId>,
): Promise<UserDocument[]> => {
  const collection = getUsersCollection();
  const uniqueIds = Array.from(
    new Set(ids.map((id) => ensureObjectId(id, "userId").toHexString())),
  ).map((value) => new ObjectId(value));

  if (uniqueIds.length === 0) {
    return [];
  }

  return collection.find({ _id: { $in: uniqueIds } }).toArray();
};

export const createUser = async (
  user: UserDefinition,
): Promise<UserDocument> => {
  const collection = getUsersCollection();
  const normalizedEmail = normalizeEmail(user.email);

  const payload: ModelInsertInput<UserDefinition> = {
    ...user,
    email: normalizedEmail,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(payload as unknown as UserDocument);
  return { ...payload, _id: result.insertedId };
};

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash?: string;
  passwordChangedAt?: Date;
}

export const updateUserById = async (
  id: string | ObjectId,
  updates: UpdateUserInput,
): Promise<UserDocument | null> => {
  const collection = getUsersCollection();
  const userId = ensureObjectId(id, "userId");

  if (updates.email) {
    const normalizedEmail = normalizeEmail(updates.email);

    updates = { ...updates, email: normalizedEmail };
  }

  const result = await collection.findOneAndUpdate(
    { _id: userId },
    { $set: { ...updates, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const deleteUserById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getUsersCollection();
  const result = await collection.deleteOne({
    _id: ensureObjectId(id, "userId"),
  });

  return result.deletedCount === 1;
};
