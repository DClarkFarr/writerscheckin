import { Collection } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  BaseModelBlueprint,
  createTimestamps,
  ModelBlueprint,
  ModelDocument,
  ModelInsertInput,
  touchTimestamps,
} from "./types";

export type AuthAttemptType = "login" | "reset" | "signup";

export interface AuthAttemptDefinition extends BaseModelBlueprint {
  identifier: string;
  ipAddress: string;
  type: AuthAttemptType;
  count: number;
  windowExpiresAt: Date;
}

export type AuthAttemptBlueprint = ModelBlueprint<AuthAttemptDefinition>;
export type AuthAttemptDocument = ModelDocument<AuthAttemptDefinition>;

export const getAuthAttemptsCollection = (): Collection<AuthAttemptDocument> =>
  getCollection<AuthAttemptDocument>(COLLECTIONS.authAttempts);

export const ensureAuthAttemptIndexes = async (): Promise<void> => {
  const collection = getAuthAttemptsCollection();
  await collection.createIndex(
    { identifier: 1, ipAddress: 1, type: 1 },
    { unique: true },
  );
  await collection.createIndex(
    { windowExpiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
};

export interface CreateAuthAttemptInput {
  identifier: string;
  ipAddress: string;
  type: AuthAttemptType;
  count: number;
  windowExpiresAt: Date;
}

export const createAuthAttempt = async (
  input: CreateAuthAttemptInput,
): Promise<AuthAttemptDocument> => {
  const collection = getAuthAttemptsCollection();
  const payload: ModelInsertInput<AuthAttemptDefinition> = {
    identifier: input.identifier,
    ipAddress: input.ipAddress,
    type: input.type,
    count: input.count,
    windowExpiresAt: input.windowExpiresAt,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as AuthAttemptDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const getAuthAttempt = async (
  identifier: string,
  ipAddress: string,
  type: AuthAttemptType,
): Promise<AuthAttemptDocument | null> => {
  const collection = getAuthAttemptsCollection();
  return collection.findOne({ identifier, ipAddress, type });
};

export const updateAuthAttempt = async (
  identifier: string,
  ipAddress: string,
  type: AuthAttemptType,
  updates: Partial<Pick<AuthAttemptDefinition, "count" | "windowExpiresAt">>,
): Promise<AuthAttemptDocument | null> => {
  const collection = getAuthAttemptsCollection();
  const result = await collection.findOneAndUpdate(
    { identifier, ipAddress, type },
    { $set: { ...updates, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};
