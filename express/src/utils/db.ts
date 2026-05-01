import { Db } from "mongodb";

let db: Db | null = null;

const setDb = (database: Db): void => {
  db = database;
};

const getDb = (): Db => {
  if (!db) {
    throw new Error("Database has not been initialized.");
  }

  return db;
};

export { db, setDb, getDb };
