import { Document, ObjectId, OptionalUnlessRequiredId, WithId } from "mongodb";

export type BaseModelBlueprint = Record<string, unknown>;

export type EntityId = ObjectId;
export type RelativeId = ObjectId;

export type ModelTimestamps = {
  createdAt: Date;
  updatedAt?: Date;
};

export type ModelBlueprint<TBlueprint extends BaseModelBlueprint> = Document &
  TBlueprint;

export type ModelDocument<TBlueprint extends BaseModelBlueprint> = WithId<
  ModelBlueprint<TBlueprint & ModelTimestamps>
>;

export type ModelInsert<TBlueprint extends BaseModelBlueprint> = ModelBlueprint<
  TBlueprint & ModelTimestamps
>;

export type ModelInsertInput<TBlueprint extends BaseModelBlueprint> =
  OptionalUnlessRequiredId<ModelBlueprint<TBlueprint & ModelTimestamps>>;

export const ensureObjectId = (
  value: string | ObjectId,
  label = "id",
): ObjectId => {
  if (value instanceof ObjectId) {
    return value;
  }

  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return new ObjectId(value);
};

export const createTimestamps = (): ModelTimestamps => ({
  createdAt: new Date(),
});

export const touchTimestamps = (): Pick<ModelTimestamps, "updatedAt"> => ({
  updatedAt: new Date(),
});
