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

export interface PasswordResetDefinition extends BaseModelBlueprint {
  userId: ObjectId;
  codeHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

export type PasswordResetBlueprint = ModelBlueprint<PasswordResetDefinition>;
export type PasswordResetDocument = ModelDocument<PasswordResetDefinition>;

export const getPasswordResetsCollection =
  (): Collection<PasswordResetDocument> =>
    getCollection<PasswordResetDocument>(COLLECTIONS.passwordResets);

export const ensurePasswordResetIndexes = async (): Promise<void> => {
  const collection = getPasswordResetsCollection();
  await collection.createIndex({ codeHash: 1 });
  await collection.createIndex({ userId: 1, createdAt: -1 });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
};

export interface CreatePasswordResetInput {
  userId: string | ObjectId;
  codeHash: string;
  expiresAt: Date;
}

export const createPasswordReset = async (
  input: CreatePasswordResetInput,
): Promise<PasswordResetDocument> => {
  const collection = getPasswordResetsCollection();
  const userId = ensureObjectId(input.userId, "userId");

  const payload: ModelInsertInput<PasswordResetDefinition> = {
    userId,
    codeHash: input.codeHash,
    expiresAt: input.expiresAt,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as PasswordResetDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const getLatestActivePasswordResetByUserId = async (
  userId: string | ObjectId,
): Promise<PasswordResetDocument | null> => {
  const collection = getPasswordResetsCollection();
  const userObjectId = ensureObjectId(userId, "userId");

  return collection.findOne(
    {
      userId: userObjectId,
      usedAt: { $exists: false },
    },
    { sort: { createdAt: -1 } },
  );
};

export const invalidateActivePasswordResetsByUserId = async (
  userId: string | ObjectId,
): Promise<number> => {
  const collection = getPasswordResetsCollection();
  const userObjectId = ensureObjectId(userId, "userId");
  const usedAt = new Date();

  const result = await collection.updateMany(
    {
      userId: userObjectId,
      usedAt: { $exists: false },
    },
    {
      $set: {
        usedAt,
        ...touchTimestamps(),
      },
    },
  );

  return result.modifiedCount;
};

export const markPasswordResetUsed = async (
  id: string | ObjectId,
): Promise<PasswordResetDocument | null> => {
  const collection = getPasswordResetsCollection();
  const resetId = ensureObjectId(id, "passwordResetId");
  const usedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: resetId, usedAt: { $exists: false } },
    { $set: { usedAt, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};
