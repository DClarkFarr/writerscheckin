import session from "express-session";
import {
  createSession,
  endSessionByToken,
  getSessionByToken,
  updateSessionByToken,
} from "../models/sessions";

type SessionPayload = Record<string, unknown>;

type SessionWithUser = session.SessionData & { userId?: string };

const resolveExpiresAt = (data: session.SessionData): Date => {
  if (data.cookie?.expires instanceof Date) {
    return data.cookie.expires;
  }

  const maxAge = data.cookie?.maxAge ?? 0;
  return new Date(Date.now() + maxAge);
};

const toPayload = (data: session.SessionData): SessionPayload => ({
  ...data,
});

const resolveUserId = (data: session.SessionData): string | undefined => {
  const candidate = (data as SessionWithUser).userId;
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : undefined;
};

export class MongoSessionStore extends session.Store {
  public get(
    sid: string,
    callback: (
      err?: Error | null,
      session?: session.SessionData | null,
    ) => void,
  ): void {
    getSessionByToken(sid)
      .then((sessionDoc) => {
        if (!sessionDoc) {
          callback(null, null);
          return;
        }

        callback(null, sessionDoc.payload as unknown as session.SessionData);
      })
      .catch((error) => callback(error as Error));
  }

  public set(
    sid: string,
    sessionData: session.SessionData,
    callback?: (err?: Error | null) => void,
  ): void {
    const expiresAt = resolveExpiresAt(sessionData);
    const userId = resolveUserId(sessionData);

    if (!userId) {
      callback?.(null);
      return;
    }

    const payload = toPayload(sessionData);

    getSessionByToken(sid)
      .then((existing) => {
        if (existing) {
          return updateSessionByToken(sid, { payload, expiresAt });
        }

        return createSession({
          userId,
          token: sid,
          payload,
          expiresAt,
        });
      })
      .then(() => callback?.(null))
      .catch((error) => callback?.(error as Error));
  }

  public destroy(sid: string, callback?: (err?: Error | null) => void): void {
    endSessionByToken(sid)
      .then(() => callback?.(null))
      .catch((error) => callback?.(error as Error));
  }

  public touch(
    sid: string,
    sessionData: session.SessionData,
    callback?: () => void,
  ): void {
    const expiresAt = resolveExpiresAt(sessionData);
    const payload = toPayload(sessionData);

    updateSessionByToken(sid, { payload, expiresAt })
      .then(() => callback?.())
      .catch(() => callback?.());
  }
}
