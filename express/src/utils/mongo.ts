import { Db, MongoClient } from "mongodb";

let client: MongoClient | null = null;

export const connectToMongo = async (mongoUrl: string): Promise<Db> => {
  if (client) {
    return client.db();
  }

  client = new MongoClient(mongoUrl);
  await client.connect();

  return client.db();
};

export const getClient = (): MongoClient => {
  if (!client) {
    throw new Error("MongoDB client has not been initialized.");
  }
  return client;
};

export const disconnectFromMongo = async (): Promise<void> => {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
};
