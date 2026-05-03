export const DEFAULT_GROUP_PAGE_SIZE = 20;
export const MAX_GROUP_PAGE_SIZE = 50;

export interface DecodedCursor {
  createdAt: Date;
  id: string;
}

type CursorValue = string | number | boolean | null;
export type OpaqueCursorPayload = Record<string, CursorValue>;

export const normalizePageSize = (limit?: number): number => {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_GROUP_PAGE_SIZE;
  }

  if (limit < 1) {
    return 1;
  }

  return Math.min(limit, MAX_GROUP_PAGE_SIZE);
};

export const encodeCursor = (input: DecodedCursor): string => {
  const raw = JSON.stringify({
    createdAt: input.createdAt.toISOString(),
    id: input.id,
  });
  return Buffer.from(raw, "utf8").toString("base64url");
};

export const decodeCursor = (value?: string): DecodedCursor | null => {
  if (!value) {
    return null;
  }

  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { createdAt?: string; id?: string };

    if (!parsed.createdAt || !parsed.id) {
      return null;
    }

    return {
      createdAt: new Date(parsed.createdAt),
      id: parsed.id,
    };
  } catch {
    return null;
  }
};

export const encodeOpaqueCursor = (payload: OpaqueCursorPayload): string => {
  const raw = JSON.stringify(payload);
  return Buffer.from(raw, "utf8").toString("base64url");
};

export const decodeOpaqueCursor = <T extends OpaqueCursorPayload>(
  value?: string,
): T | null => {
  if (!value) {
    return null;
  }

  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as T;
  } catch {
    return null;
  }
};
