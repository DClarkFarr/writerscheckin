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

export interface SessionDefinition extends BaseModelBlueprint {
  userId: ObjectId;
  token: string;
  payload: Record<string, unknown>;
  expiresAt: Date;
}

export type SessionBlueprint = ModelBlueprint<SessionDefinition>;
export type SessionDocument = ModelDocument<SessionDefinition>;

export const getSessionsCollection = (): Collection<SessionDocument> =>
  getCollection<SessionDocument>(COLLECTIONS.sessions);

export const ensureSessionIndexes = async (): Promise<void> => {
  const collection = getSessionsCollection();
  await collection.createIndex({ token: 1 }, { unique: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
};

const assertNotExpired = (expiresAt: Date): void => {
  if (expiresAt <= new Date()) {
    throw new Error("Session has expired");
  }
};

export interface CreateSessionInput {
  userId: string | ObjectId;
  token: string;
  payload: Record<string, unknown>;
  expiresAt: Date;
}

export const createSession = async (
  input: CreateSessionInput,
): Promise<SessionDocument> => {
  const collection = getSessionsCollection();
  const userId = ensureObjectId(input.userId, "userId");

  assertNotExpired(input.expiresAt);

  const payload: ModelInsertInput<SessionDefinition> = {
    userId,
    token: input.token,
    payload: input.payload,
    expiresAt: input.expiresAt,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as SessionDocument,
  );
  return { ...payload, _id: result.insertedId };
};

export const getSessionById = async (
  id: string | ObjectId,
): Promise<SessionDocument | null> => {
  const collection = getSessionsCollection();
  return collection.findOne({ _id: ensureObjectId(id, "sessionId") });
};

export const getSessionByToken = async (
  token: string,
): Promise<SessionDocument | null> => {
  const collection = getSessionsCollection();
  const session = await collection.findOne({ token });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  return session;
};

export interface UpdateSessionInput {
  payload?: Record<string, unknown>;
  expiresAt?: Date;
}

export const updateSessionById = async (
  id: string | ObjectId,
  updates: UpdateSessionInput,
): Promise<SessionDocument | null> => {
  const collection = getSessionsCollection();
  const sessionId = ensureObjectId(id, "sessionId");
  const updatePayload: Partial<SessionDefinition> = { ...updates };

  if (updates.expiresAt) {
    assertNotExpired(updates.expiresAt);
  }

  const result = await collection.findOneAndUpdate(
    { _id: sessionId },
    { $set: { ...updatePayload, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const updateSessionByToken = async (
  token: string,
  updates: UpdateSessionInput,
): Promise<SessionDocument | null> => {
  const collection = getSessionsCollection();
  const updatePayload: Partial<SessionDefinition> = { ...updates };

  if (updates.expiresAt) {
    assertNotExpired(updates.expiresAt);
  }

  const result = await collection.findOneAndUpdate(
    { token },
    { $set: { ...updatePayload, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const endSessionById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getSessionsCollection();
  const result = await collection.deleteOne({
    _id: ensureObjectId(id, "sessionId"),
  });

  return result.deletedCount === 1;
};

export const endSessionByToken = async (token: string): Promise<boolean> => {
  const collection = getSessionsCollection();
  const result = await collection.deleteOne({ token });

  return result.deletedCount === 1;
};

export const endSessionsByUserId = async (
  userId: string | ObjectId,
): Promise<number> => {
  const collection = getSessionsCollection();
  const resolvedUserId = ensureObjectId(userId, "userId");
  const result = await collection.deleteMany({ userId: resolvedUserId });

  return result.deletedCount ?? 0;
};
