import { Collection, Document } from "mongodb";
import { db } from "../utils/db";

export const getCollection = <T extends Document>(
  name: string,
): Collection<T> => db!.collection<T>(name);

export const COLLECTIONS = {
  users: "users",
  stories: "stories",
  tags: "tags",
  characters: "characters",
  plots: "plots",
  scenes: "scenes",
  sections: "sections",
  sessions: "sessions",
  passwordResets: "passwordResets",
  authAttempts: "authAttempts",
  colors: "colors",
} as const;
