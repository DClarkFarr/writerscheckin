import { Collection, Filter, ObjectId, type Document } from "mongodb";
import { COLLECTIONS, getCollection } from "./collections";
import {
  activeRecordFilter,
  assertDurationMinutes,
  GroupMeetingStatus,
  MeetingTimeOfDay,
  assertMeetingStatus,
  assertNonNegativeInteger,
  assertTimeOfDay,
  softDeletePatch,
  toObjectId,
} from "./groupModelCommon";
import {
  BaseModelBlueprint,
  createTimestamps,
  ensureDate,
  ensureObjectId,
  ModelBlueprint,
  ModelDocument,
  ModelInsertInput,
  touchTimestamps,
} from "./types";
import type { GroupMemberDocument } from "./groupMembers";
import {
  buildCurrentMemberMeetingAttendanceLookup,
  type MeetingAttendeeDocument,
} from "./meetingAttendees";
import { normalizePageSize, type DecodedCursor } from "../utils/pagination";

export interface GroupMeetingDefinition extends BaseModelBlueprint {
  groupId: ObjectId;
  name: string;
  occursAt: Date;
  description: string;
  emailMessage: string;
  address: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  publishEmailMessage: string;
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  endCheckinHoursBefore: number;
  attendanceNotified: boolean;
  status: GroupMeetingStatus;
  cancelledAt: Date | null;
  deletedAt?: Date;
}

export type GroupMeetingBlueprint = ModelBlueprint<GroupMeetingDefinition>;
export type GroupMeetingDocument = ModelDocument<GroupMeetingDefinition>;

export interface CreateGroupMeetingInput {
  groupId: string | ObjectId;
  name: string;
  occursAt?: Date;
  description?: string;
  emailMessage?: string;
  address?: string;
  startTime: MeetingTimeOfDay;
  durationMinutes: number;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  endCheckinHoursBefore?: number;
  cancelledAt?: Date;
  status?: GroupMeetingStatus;
}

export interface UpdateGroupMeetingInput {
  name?: string;
  occursAt?: Date;
  description?: string;
  emailMessage?: string;
  address?: string;
  startTime?: MeetingTimeOfDay;
  durationMinutes?: number;
  publishEmailMessage?: string;
  attendanceEmailMessage?: string;
  publishHoursBefore?: number;
  notifyAttendanceHoursBefore?: number;
  endCheckinHoursBefore?: number;
  attendanceNotified?: boolean;
  status?: GroupMeetingStatus;
}

export interface ListGroupMeetingsOptions {
  includeDeleted?: boolean;
  limit?: number;
}

export interface CountGroupMeetingsOptions {
  includeDeleted?: boolean;
  status?: GroupMeetingStatus;
  onlyPast?: boolean;
  referenceDate?: Date;
}

export const getGroupMeetingsCollection =
  (): Collection<GroupMeetingDocument> =>
    getCollection<GroupMeetingDocument>(COLLECTIONS.groupMeetings);

export const ensureGroupMeetingIndexes = async (): Promise<void> => {
  const collection = getGroupMeetingsCollection();
  await collection.createIndex({
    groupId: 1,
    status: 1,
    deletedAt: 1,
    occursAt: 1,
    createdAt: 1,
  });
};

const normalizeString = (value: string): string => value.trim();

// Template fields store HTML-compatible rich text and should only be trimmed.
const normalizeTemplateHtml = (value: string): string => value.trim();

const assertDate = (value: Date, label: string): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`${label} must be a valid datetime.`);
  }

  return value;
};

const normalizeCreateInput = (
  input: CreateGroupMeetingInput,
): GroupMeetingDefinition => {
  const name = normalizeString(input.name);

  if (!name) {
    throw new Error("Meeting name is required.");
  }

  assertTimeOfDay(input.startTime);
  assertDurationMinutes(input.durationMinutes);
  assertNonNegativeInteger(input.publishHoursBefore, "publishHoursBefore");
  assertNonNegativeInteger(
    input.notifyAttendanceHoursBefore,
    "notifyAttendanceHoursBefore",
  );

  const endCheckinHoursBefore = input.endCheckinHoursBefore ?? 0;
  assertNonNegativeInteger(endCheckinHoursBefore, "endCheckinHoursBefore");

  return {
    groupId: toObjectId(input.groupId, "groupId"),
    name,
    occursAt: assertDate(input.occursAt ?? new Date(), "occursAt"),
    description: normalizeString(input.description ?? ""),
    emailMessage: normalizeString(input.emailMessage ?? ""),
    address: normalizeString(input.address ?? ""),
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    publishEmailMessage: normalizeTemplateHtml(input.publishEmailMessage ?? ""),
    attendanceEmailMessage: normalizeTemplateHtml(
      input.attendanceEmailMessage ?? "",
    ),
    publishHoursBefore: input.publishHoursBefore,
    notifyAttendanceHoursBefore: input.notifyAttendanceHoursBefore,
    endCheckinHoursBefore,
    attendanceNotified: false,
    cancelledAt: input.cancelledAt
      ? assertDate(input.cancelledAt, "cancelledAt")
      : null,
    status: assertMeetingStatus(input.status ?? "draft"),
  };
};

const normalizeUpdateInput = (
  updates: UpdateGroupMeetingInput,
): Partial<GroupMeetingDefinition> => {
  const normalized: Partial<GroupMeetingDefinition> = {};

  if (typeof updates.name === "string") {
    const name = normalizeString(updates.name);

    if (!name) {
      throw new Error("Meeting name is required.");
    }

    normalized.name = name;
  }

  if (updates.occursAt instanceof Date) {
    normalized.occursAt = assertDate(updates.occursAt, "occursAt");
  }

  if (typeof updates.description === "string") {
    normalized.description = normalizeString(updates.description);
  }

  if (typeof updates.emailMessage === "string") {
    normalized.emailMessage = normalizeString(updates.emailMessage);
  }

  if (typeof updates.address === "string") {
    normalized.address = normalizeString(updates.address);
  }

  if (updates.startTime) {
    assertTimeOfDay(updates.startTime);
    normalized.startTime = updates.startTime;
  }

  if (typeof updates.durationMinutes === "number") {
    assertDurationMinutes(updates.durationMinutes);
    normalized.durationMinutes = updates.durationMinutes;
  }

  if (typeof updates.publishEmailMessage === "string") {
    normalized.publishEmailMessage = normalizeTemplateHtml(
      updates.publishEmailMessage,
    );
  }

  if (typeof updates.attendanceEmailMessage === "string") {
    normalized.attendanceEmailMessage = normalizeTemplateHtml(
      updates.attendanceEmailMessage,
    );
  }

  if (typeof updates.publishHoursBefore === "number") {
    assertNonNegativeInteger(updates.publishHoursBefore, "publishHoursBefore");
    normalized.publishHoursBefore = updates.publishHoursBefore;
  }

  if (typeof updates.notifyAttendanceHoursBefore === "number") {
    assertNonNegativeInteger(
      updates.notifyAttendanceHoursBefore,
      "notifyAttendanceHoursBefore",
    );
    normalized.notifyAttendanceHoursBefore =
      updates.notifyAttendanceHoursBefore;
  }

  if (typeof updates.endCheckinHoursBefore === "number") {
    assertNonNegativeInteger(
      updates.endCheckinHoursBefore,
      "endCheckinHoursBefore",
    );
    normalized.endCheckinHoursBefore = updates.endCheckinHoursBefore;
  }

  if (typeof updates.attendanceNotified === "boolean") {
    normalized.attendanceNotified = updates.attendanceNotified;
  }

  if (typeof updates.status === "string") {
    normalized.status = assertMeetingStatus(updates.status);
  }

  return normalized;
};

export const createGroupMeeting = async (
  input: CreateGroupMeetingInput,
): Promise<GroupMeetingDocument> => {
  const collection = getGroupMeetingsCollection();
  const meeting = normalizeCreateInput(input);
  const payload: ModelInsertInput<GroupMeetingDefinition> = {
    ...meeting,
    ...createTimestamps(),
  };

  const result = await collection.insertOne(
    payload as unknown as GroupMeetingDocument,
  );

  return { ...payload, _id: result.insertedId };
};

export const getGroupMeetingById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();

  return collection.findOne({
    _id: toObjectId(id, "groupMeetingId"),
    ...activeRecordFilter(),
  });
};

export const listGroupMeetingsByGroupId = async (
  groupId: string | ObjectId,
  options: ListGroupMeetingsOptions = {},
): Promise<GroupMeetingDocument[]> => {
  const collection = getGroupMeetingsCollection();
  const limit = options.limit ?? 200;

  return collection
    .find({
      groupId: toObjectId(groupId, "groupId"),
      ...activeRecordFilter(options.includeDeleted),
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
};

export const listGroupMeetingsForFeed = async ({
  groupId,
  statuses,
  now,
  limit,
}: ListGroupMeetingsForFeedProps): Promise<GroupMeetingDocument[]> => {
  const collection = getGroupMeetingsCollection();
  const reference = now ?? new Date();

  return collection
    .find({
      groupId: toObjectId(groupId, "groupId"),
      status: { $in: statuses },
      occursAt: { $lt: reference },
      ...activeRecordFilter(),
    })
    .sort({ occursAt: 1, name: 1, _id: 1 })
    .limit(typeof limit === "number" ? limit : 500)
    .toArray();
};

export interface ListGroupMeetingsByGroupIdPaginatedProps {
  groupId: string | ObjectId;
  cursor?: DecodedCursor | null;
  limit?: number;
  futureOnly?: boolean;
  pastOnly?: boolean;
  statuses?: GroupMeetingStatus[];
}

export interface ListGroupMeetingsForFeedProps {
  groupId: string | ObjectId;
  statuses: GroupMeetingStatus[];
  now?: Date;
  limit?: number;
}

export interface ListDueDraftMeetingsByPublishWindowInput {
  now?: Date;
  windowMinutes?: number;
  limit?: number;
}

export interface ListAnnounceMeetingAttendanceInput {
  now?: Date;
  windowMinutes?: number;
  limit?: number;
}

export type DueDraftMeetingCandidateRow = GroupMeetingDocument & {
  publishAtComputed: Date;
};

export type AnnounceMeetingAttendanceCandidateRow = GroupMeetingDocument & {
  notifyAt: Date;
};
export type MemberMeetingAggregationBaseItem = GroupMeetingDocument & {
  membership: GroupMemberDocument;
};

export type MemberMeetingAggregationItem = MemberMeetingAggregationBaseItem & {
  attendance: MeetingAttendeeDocument | null;
};

export interface AggregationMemberNextUpcomingMeetingInput {
  userId: string | ObjectId;
}

export interface AggregationMemberMeetingsPaginatedInput {
  userId: string | ObjectId;
  cursor: DecodedCursor | null;
  limit: number | undefined;
}

const getGroupMembersCollection = (): Collection<GroupMemberDocument> =>
  getCollection<GroupMemberDocument>(COLLECTIONS.groupMembers);

const MemberMeetingAggregation = {
  userActiveMemberships: (userId: string | ObjectId): Document[] => {
    return [
      {
        $match: {
          $and: [
            {
              userId: ensureObjectId(userId, "userId"),
            },
            {
              $or: [
                {
                  role: "owner",
                },
                {
                  status: "accepted",
                },
              ],
            },
          ],
        },
      },
    ];
  },
  membershipsToMeetingLookup: (): Document[] => {
    return [
      {
        $lookup: {
          from: COLLECTIONS.groupMeetings,
          localField: "groupId",
          foreignField: "groupId",
          as: "meeting",
        },
      },
      {
        $unwind: {
          path: "$meeting",
          includeArrayIndex: "string",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$meeting",
              {
                membership: {
                  $unsetField: {
                    field: "meeting",
                    input: "$$ROOT",
                  },
                },
              },
            ],
          },
        },
      },
    ];
  },
  matchUpcomingMeeting: (date: Date | string): Document[] => {
    return [
      {
        $match: {
          occursAt: {
            $gte: ensureDate(date, "date"),
          },
        },
      },
    ];
  },
  matchPublishedOrAdminMeeting: (): Document[] => {
    return [
      {
        $match: {
          $or: [
            {
              "membership.role": {
                $in: ["admin", "owner"],
              },
            },
            {
              "membership.role": "member",
              status: {
                $ne: "draft",
              },
            },
          ],
        },
      },
    ];
  },
  matchAfterCursor: (cursor: DecodedCursor | null | undefined): Document[] => {
    if (!cursor) {
      return [];
    }

    return [
      {
        $match: {
          $or: [
            {
              occursAt: {
                $lt: ensureDate(cursor.date, "cursor.date"),
              },
            },
            {
              occursAt: ensureDate(cursor.date, "cursor.date"),
              _id: {
                $lt: ensureObjectId(cursor.id, "cursor.id"),
              },
            },
          ],
        },
      },
    ];
  },
  sortMeetingsByOccursAt: (sort: 1 | -1): Document[] => {
    return [
      {
        $sort: {
          occursAt: sort,
          _id: sort,
        },
      },
    ];
  },
  takeFirstOfEachGroup: (): Document[] => {
    return [
      {
        $group: {
          _id: {
            groupId: "$groupId",
          },
          row: {
            $first: "$$ROOT",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$row",
        },
      },
    ];
  },
  takeByLimit: (limit: number): Document[] => {
    return [
      {
        $limit: limit,
      },
    ];
  },
};
export const listGroupMeetingsByGroupIdPaginated = async ({
  groupId,
  cursor,
  futureOnly,
  pastOnly,
  limit,
  statuses,
}: ListGroupMeetingsByGroupIdPaginatedProps) => {
  const collection = getGroupMeetingsCollection();
  const pageSize = normalizePageSize(limit);

  const filters: Filter<GroupMeetingDocument> = {
    groupId: toObjectId(groupId, "groupId"),
    ...activeRecordFilter(),
  };

  if (Array.isArray(statuses) && statuses.length > 0) {
    filters.status = { $in: statuses };
  }

  if (futureOnly) {
    filters.occursAt = { $gte: new Date() };
  } else if (pastOnly) {
    filters.occursAt = { $lt: new Date() };
  }

  const hasCursorDate =
    cursor?.date instanceof Date &&
    !Number.isNaN(cursor.date.getTime()) &&
    Boolean(cursor.id);

  if (hasCursorDate) {
    const cursorDate = cursor.date as Date;
    const cursorId =
      typeof cursor?.id === "string" && ObjectId.isValid(cursor.id)
        ? new ObjectId(cursor.id)
        : null;

    filters.$or = cursorId
      ? [
          { occursAt: { $lt: cursorDate } },
          { occursAt: cursorDate, _id: { $lt: cursorId } },
        ]
      : [{ occursAt: { $lt: cursorDate } }];
  }

  const items = await collection
    .find(filters)
    .sort({ occursAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .toArray();

  const hasMore = items.length > pageSize;
  const pageItems = hasMore ? items.slice(0, pageSize) : items;

  let nextCursor: DecodedCursor | null = null;
  const lastItem = pageItems.at(-1);
  if (lastItem && hasMore) {
    const occursAt = lastItem.occursAt ?? lastItem.createdAt;
    nextCursor = {
      date: new Date(occursAt),
      id: lastItem._id.toHexString(),
    };
  }

  return {
    items: pageItems,
    nextCursor,
  };
};

export const countGroupMeetingsByGroupId = async (
  groupId: string | ObjectId,
  options: CountGroupMeetingsOptions = {},
): Promise<number> => {
  const collection = getGroupMeetingsCollection();
  const referenceDate = options.referenceDate ?? new Date();

  return collection.countDocuments({
    groupId: toObjectId(groupId, "groupId"),
    ...activeRecordFilter(options.includeDeleted),
    ...(options.status ? { status: assertMeetingStatus(options.status) } : {}),
    ...(options.onlyPast
      ? {
          $or: [
            { occursAt: { $lt: referenceDate } },
            { occursAt: { $exists: false } },
          ],
        }
      : {}),
  });
};

export const getNextUpcomingMeetingByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const now = new Date();

  const meetingWithOccurrence = await collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      status: "draft",
      occursAt: { $gte: now },
      ...activeRecordFilter(),
    },
    {
      sort: { occursAt: 1, createdAt: 1 },
    },
  );

  if (meetingWithOccurrence) {
    return meetingWithOccurrence;
  }

  return collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      status: "draft",
      ...activeRecordFilter(),
    },
    {
      sort: { createdAt: -1 },
    },
  );
};

export const getLatestUpcomingMeetingByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const now = new Date();

  const meetingWithOccurrence = await collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      occursAt: { $gte: now },
      ...activeRecordFilter(),
    },
    {
      sort: { occursAt: -1, createdAt: -1 },
    },
  );

  return meetingWithOccurrence;
};

export const getNextUpcomingPublishedMeetingByGroupId = async (
  groupId: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const now = new Date();

  return collection.findOne(
    {
      groupId: toObjectId(groupId, "groupId"),
      status: "published",
      occursAt: { $gte: now },
      ...activeRecordFilter(),
    },
    {
      sort: { occursAt: 1, name: 1, _id: 1 },
    },
  );
};

export const listDueMeetingsForAnnouncement = async (
  input: ListAnnounceMeetingAttendanceInput = {},
): Promise<AnnounceMeetingAttendanceCandidateRow[]> => {
  const collection = getGroupMeetingsCollection();
  const now = input.now ?? new Date();
  const windowMinutes = input.windowMinutes ?? 20;
  const limit = input.limit ?? 500;

  if (!Number.isInteger(windowMinutes) || windowMinutes <= 0) {
    throw new Error("windowMinutes must be a positive integer.");
  }

  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const rows = await collection
    .aggregate<AnnounceMeetingAttendanceCandidateRow>([
      {
        $match: {
          status: "published",
          cancelledAt: null,
          attendanceNotified: { $ne: true },
          ...activeRecordFilter(),
        },
      },
      {
        $addFields: {
          notifyAt: {
            $dateSubtract: {
              startDate: "$occursAt",
              unit: "hour",
              amount: "$notifyAttendanceHoursBefore",
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ["$notifyAt", windowStart] },
              { $lte: ["$notifyAt", now] },
            ],
          },
        },
      },
      {
        $sort: {
          notifyAt: 1,
          _id: 1,
        },
      },
      {
        $limit: limit,
      },
    ])
    .toArray();

  return rows;
};

export const listDueDraftMeetingsByPublishWindow = async (
  input: ListDueDraftMeetingsByPublishWindowInput = {},
): Promise<DueDraftMeetingCandidateRow[]> => {
  const collection = getGroupMeetingsCollection();
  const now = input.now ?? new Date();
  const windowMinutes = input.windowMinutes ?? 20;
  const limit = input.limit ?? 500;

  if (!Number.isInteger(windowMinutes) || windowMinutes <= 0) {
    throw new Error("windowMinutes must be a positive integer.");
  }

  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const rows = await collection
    .aggregate<DueDraftMeetingCandidateRow>([
      {
        $match: {
          status: "draft",
          cancelledAt: null,
          ...activeRecordFilter(),
        },
      },
      {
        $addFields: {
          publishAtComputed: {
            $dateSubtract: {
              startDate: "$occursAt",
              unit: "hour",
              amount: "$publishHoursBefore",
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $gte: ["$publishAtComputed", windowStart] },
              { $lte: ["$publishAtComputed", now] },
            ],
          },
        },
      },
      {
        $sort: {
          publishAtComputed: 1,
          _id: 1,
        },
      },
      {
        $limit: limit,
      },
    ])
    .toArray();

  return rows;
};

export const updateGroupMeetingById = async (
  id: string | ObjectId,
  updates: UpdateGroupMeetingInput,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const normalized = normalizeUpdateInput(updates);

  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    { $set: { ...normalized, ...touchTimestamps() } },
    { returnDocument: "after" },
  );

  return result;
};

export const publishGroupMeetingById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: {
        status: assertMeetingStatus("published"),
        attendanceNotified: false,
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const markGroupMeetingAttendanceNotifiedById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: {
        attendanceNotified: true,
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const cancelGroupMeetingById = async (
  id: string | ObjectId,
): Promise<GroupMeetingDocument | null> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: {
        cancelledAt: new Date(),
        ...touchTimestamps(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
};

export const getAggregationMemberNextUpcomingMeetings = async ({
  userId,
}: AggregationMemberNextUpcomingMeetingInput): Promise<
  MemberMeetingAggregationBaseItem[]
> => {
  const groupMembersCollection = getGroupMembersCollection();

  const rows = await groupMembersCollection
    .aggregate<MemberMeetingAggregationBaseItem>([
      ...MemberMeetingAggregation.userActiveMemberships(userId),
      ...MemberMeetingAggregation.membershipsToMeetingLookup(),
      ...MemberMeetingAggregation.matchUpcomingMeeting(new Date()),
      ...MemberMeetingAggregation.matchPublishedOrAdminMeeting(),
      ...MemberMeetingAggregation.sortMeetingsByOccursAt(1),
      ...MemberMeetingAggregation.takeFirstOfEachGroup(),
      ...MemberMeetingAggregation.sortMeetingsByOccursAt(-1),
    ])
    .toArray();

  return rows;
};

export const getAggregationMemberMeetingsPaginated = async ({
  userId,
  cursor,
  limit = 20,
}: AggregationMemberMeetingsPaginatedInput): Promise<
  MemberMeetingAggregationItem[]
> => {
  const groupMembersCollection = getGroupMembersCollection();

  const rows = await groupMembersCollection
    .aggregate<MemberMeetingAggregationItem>([
      ...MemberMeetingAggregation.userActiveMemberships(userId),
      ...MemberMeetingAggregation.membershipsToMeetingLookup(),
      ...MemberMeetingAggregation.matchPublishedOrAdminMeeting(),
      ...MemberMeetingAggregation.matchAfterCursor(cursor),
      ...buildCurrentMemberMeetingAttendanceLookup(),
      ...MemberMeetingAggregation.sortMeetingsByOccursAt(-1),
      ...MemberMeetingAggregation.takeByLimit(limit),
    ])
    .toArray();

  return rows;
};

export const softDeleteGroupMeetingById = async (
  id: string | ObjectId,
): Promise<boolean> => {
  const collection = getGroupMeetingsCollection();
  const result = await collection.updateOne(
    {
      _id: toObjectId(id, "groupMeetingId"),
      ...activeRecordFilter(),
    },
    {
      $set: softDeletePatch(),
    },
  );

  return result.modifiedCount === 1;
};

export { toObjectId };
