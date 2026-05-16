import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import { AuthError, AuthSession } from "../services/authService";
import {
  createManagedGroup,
  listManagedGroupMeetingsPaginated,
  listManagedGroupMembersPaginated,
  getManagedGroupForm,
  leaveGroup,
  listMyGroupsSummary,
  searchGroupParticipants,
  updateManagedGroup,
} from "../services/groupsService";
import {
  addGroupMember,
  getGroupMemberNotificationSettings,
  updateGroupMemberNotificationSettings,
  updateGroupMemberRole,
  removeGroupMember,
  respondToGroupInvite,
} from "../services/groupMembersService";
import { isGroupMemberNotificationType } from "../models/groupMembers";
import {
  createUpcomingMeetingFromDefaults,
  buildMeetingDetailResponse,
  buildEditableMeetingResponse,
  publishMeetingNowById,
  type MeetingAutosaveResult,
  type PublishMeetingResult,
  type CancelMeetingResult,
  getAggregationMemberMeetingsPaginated,
  memberMeetingAggregationRowToResponse,
} from "../services/groupMeetingsService";
import { updateMeetingCheckin } from "../services/meetingCheckinService";
import { GroupMemberInviteStatus } from "../models/groupModelCommon";
import { decodeCursor, encodeCursor } from "../utils/pagination";
import {
  getGroupMeetingById,
  updateGroupMeetingById,
  cancelGroupMeetingById,
  UpdateGroupMeetingInput,
} from "../models/groupMeetings";
import { getGroupById } from "../models/groups";
import {
  socketGroupEmitGroupSummaryItem,
  socketGroupEmitMeetingItem,
} from "../services/socketEventsService";

export const groupsRouter = express.Router({ mergeParams: true });

const getSession = (req: Request): AuthSession =>
  (req as Request & { session: AuthSession }).session;

const getAuthenticatedUserId = (req: Request): string => {
  const sessionData = getSession(req);
  const userId = sessionData.userId;

  if (!userId) {
    throw new Error("Unauthorized userId required.");
  }

  return userId;
};

const ensureGroupMemberInviteStatus = (
  status: string,
): GroupMemberInviteStatus | undefined => {
  return !!status &&
    ["invited", "accepted", "declined", "cancelled", "removed"].includes(status)
    ? (status as GroupMemberInviteStatus)
    : undefined;
};

const ensureGroupMemberInviteStatuses = (
  value: unknown,
): GroupMemberInviteStatus[] | undefined => {
  const queryValues = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? [value]
      : [];

  const statusesRaw = queryValues.flatMap((item) => item.split(","));

  const statuses = Array.from(
    new Set(
      statusesRaw
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => ensureGroupMemberInviteStatus(item))
        .filter((item): item is GroupMemberInviteStatus => item !== undefined),
    ),
  );

  return statuses.length > 0 ? statuses : undefined;
};

const getRouteParam = (
  value: string | string[] | undefined,
  label: string,
): string => {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
};

const getRouteBooleanParam = (
  value: string | string[] | undefined,
  label: string,
): boolean | null => {
  const stringBoolean = getRouteParam(value, label);

  if (stringBoolean === "true") {
    return true;
  } else if (stringBoolean === "false") {
    return false;
  }

  return null;
};

const applyGroupRoutes = () => {
  groupsRouter.post(
    "/",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const data = await createManagedGroup(
        {
          name: req.body?.name,
          description: req.body?.description,
          address: req.body?.address,
          startTime: req.body?.startTime,
          durationMinutes: req.body?.durationMinutes,
          recurrenceFrequency: req.body?.recurrenceFrequency,
          recurrenceDaysOfWeek: req.body?.recurrenceDaysOfWeek,
          endCheckinHoursBefore: req.body?.endCheckinHoursBefore,
          // Keep frontend aliases stable: publicMessage/attendanceMessage map
          // to backend publishEmailMessage/attendanceEmailMessage fields.
          publicMessage: req.body?.publicMessage,
          attendanceMessage: req.body?.attendanceMessage,
          members: Array.isArray(req.body?.members) ? req.body.members : [],
        },
        userId,
      );

      res.status(201).json(data);
    }),
  );

  groupsRouter.get(
    "/participants/search",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);

      const query = typeof req.query.q === "string" ? req.query.q : undefined;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const items = await searchGroupParticipants({
        ...(query ? { query } : {}),
        excludeUserId: userId,
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json({ items });
    }),
  );

  groupsRouter.get(
    "/mine",
    handleAsync(async (req, res) => {
      const sessionData = getSession(req);
      const userId = sessionData.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cursor =
        typeof req.query.cursor === "string"
          ? decodeCursor(req.query.cursor)
          : null;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const status =
        typeof req.query.status === "string"
          ? ensureGroupMemberInviteStatus(req.query.status)
          : undefined;

      const data = await listMyGroupsSummary({
        userId,
        status,
        cursor,
        limit,
      });

      res.status(200).json({ items: data.items, nextCursor: data.nextCursor });
    }),
  );

  groupsRouter.get(
    "/meetings/mine",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const cursor =
        typeof req.query.cursor === "string"
          ? decodeCursor(req.query.cursor)
          : null;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const rows = await getAggregationMemberMeetingsPaginated({
        userId,
        cursor,
        limit,
      });

      const lastRow = rows.at(-1) ?? null;
      const data = {
        rows: rows.map(memberMeetingAggregationRowToResponse),
        nextCursor: lastRow
          ? encodeCursor({
              date: lastRow.occursAt,
              id: lastRow._id.toHexString(),
            })
          : null,
      };

      res.status(200).json(data);
    }),
  );

  groupsRouter.post(
    "/meetings/:meetingId/checkin",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const stateRaw = req.body?.state;
      if (
        stateRaw !== "attending" &&
        stateRaw !== "reading" &&
        stateRaw !== "not_attending"
      ) {
        throw new Error("Invalid check-in state.");
      }

      let data;
      try {
        data = await updateMeetingCheckin({
          meetingId,
          userId,
          state: stateRaw,
        });
      } catch (error) {
        if (
          error instanceof AuthError &&
          error.status === 409 &&
          /check-in period has ended/i.test(error.message)
        ) {
          res.status(409).json({ message: "Check-in period has ended." });
          return;
        }

        throw error;
      }

      socketGroupEmitGroupSummaryItem(data.groupId);
      socketGroupEmitMeetingItem(data.groupId, data.meetingId);

      res.status(200).json(data);
    }),
  );

  groupsRouter.post(
    "/members/:membershipId/respond",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const membershipId = getRouteParam(
        req.params.membershipId,
        "membershipId",
      );

      const actionRaw = req.body?.action;
      if (actionRaw !== "accept" && actionRaw !== "decline") {
        throw new Error("Invalid invite action.");
      }

      const data = await respondToGroupInvite({
        membershipId,
        userId,
        action: actionRaw,
      });

      socketGroupEmitGroupSummaryItem(data.groupId);

      res.status(200).json(data);
    }),
  );

  groupsRouter.get(
    "/:groupId",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const data = await getManagedGroupForm(groupId, userId);

      res.status(200).json(data);
    }),
  );

  groupsRouter.get(
    "/:groupId/notifications/me",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const data = await getGroupMemberNotificationSettings({
        groupId,
        userId,
      });

      res.status(200).json(data);
    }),
  );

  groupsRouter.patch(
    "/:groupId/notifications/me",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");

      const notificationType = req.body?.notificationType;
      const unsubscribed = req.body?.unsubscribed;

      if (typeof notificationType !== "string") {
        throw new Error("notificationType is required.");
      }

      if (!isGroupMemberNotificationType(notificationType)) {
        throw new Error("Invalid notificationType.");
      }

      if (typeof unsubscribed !== "boolean") {
        throw new Error("unsubscribed must be a boolean.");
      }

      const data = await updateGroupMemberNotificationSettings({
        groupId,
        userId,
        notificationType,
        unsubscribed,
      });

      res.status(200).json(data);
    }),
  );

  groupsRouter.patch(
    "/:groupId",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const data = await updateManagedGroup(
        groupId,
        {
          name: req.body?.name,
          description: req.body?.description,
          address: req.body?.address,
          startTime: req.body?.startTime,
          durationMinutes: req.body?.durationMinutes,
          recurrenceFrequency: req.body?.recurrenceFrequency,
          recurrenceDaysOfWeek: req.body?.recurrenceDaysOfWeek,
          endCheckinHoursBefore: req.body?.endCheckinHoursBefore,
          // Keep frontend aliases stable: publicMessage/attendanceMessage map
          // to backend publishEmailMessage/attendanceEmailMessage fields.
          publicMessage: req.body?.publicMessage,
          attendanceMessage: req.body?.attendanceMessage,
          members: Array.isArray(req.body?.members) ? req.body.members : [],
        },
        userId,
      );

      socketGroupEmitGroupSummaryItem(groupId);

      res.status(200).json(data);
    }),
  );

  groupsRouter.patch(
    "/:id/leave",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.id, "id");

      await leaveGroup(groupId, userId);

      socketGroupEmitGroupSummaryItem(groupId);

      res.status(200).json({
        success: true,
        message: "You have left the group",
      });
    }),
  );

  groupsRouter.post(
    "/:groupId/meetings/upcoming",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const data = await createUpcomingMeetingFromDefaults({
        groupId,
        userId,
      });

      res.status(201).json(data);
    }),
  );

  groupsRouter.delete(
    "/:groupId/members/:memberId",
    handleAsync(async (req, res) => {
      getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const memberId = getRouteParam(req.params.memberId, "memberId");

      await removeGroupMember({ groupId, memberId });

      socketGroupEmitGroupSummaryItem(groupId);

      res.status(200).json({
        success: true,
        message: "Member removed",
        memberStatus: "removed",
      });
    }),
  );

  groupsRouter.post(
    "/:groupId/members",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const identifier =
        typeof req.body?.identifier === "string" ? req.body.identifier : "";
      const role = typeof req.body?.role === "string" ? req.body.role : "";

      const created = await addGroupMember({
        groupId,
        identifier,
        role,
        invitedBy: userId,
      });

      socketGroupEmitGroupSummaryItem(groupId);

      res.status(201).json({
        success: true,
        _id: created._id.toHexString(),
        identifier: created.userId
          ? created.userId.toHexString()
          : (created.email ?? identifier),
        role: created.role,
        userId: created.userId ? created.userId.toHexString() : null,
        email: created.email ?? null,
        status: created.status,
      });
    }),
  );

  groupsRouter.patch(
    "/:groupId/members/:memberId/role",
    handleAsync(async (req, res) => {
      getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const memberId = getRouteParam(req.params.memberId, "memberId");
      const role = req.body?.role;

      const updated = await updateGroupMemberRole({ groupId, memberId, role });

      socketGroupEmitGroupSummaryItem(groupId);

      res.status(200).json({
        success: true,
        _id: updated._id.toHexString(),
        role: updated.role,
        updatedAt: updated.updatedAt,
      });
    }),
  );

  groupsRouter.get(
    "/:groupId/meetings",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const cursor =
        typeof req.query.cursor === "string"
          ? decodeCursor(req.query.cursor)
          : null;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const data = await listManagedGroupMeetingsPaginated({
        groupId,
        userId,
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json(data);
    }),
  );

  // GET /:groupId/meetings/:meetingId - Member detail view
  groupsRouter.get(
    "/:groupId/meetings/:meetingId",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const meeting = await getGroupMeetingById(meetingId);
      if (!meeting || meeting.groupId.toHexString() !== groupId) {
        throw new Error("Meeting not found.");
      }

      const group = await getGroupById(groupId);
      if (!group) {
        throw new Error("Group not found.");
      }

      // Keep 404 semantics for missing records while allowing the service
      // layer to return status-aware invite-link payloads for non-members.
      const data = await buildMeetingDetailResponse(meeting, group, userId);
      res.status(200).json(data);
    }),
  );

  // GET /:groupId/meetings/:meetingId/edit - Admin edit-read view
  groupsRouter.get(
    "/:groupId/meetings/:meetingId/edit",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const meeting = await getGroupMeetingById(meetingId);
      if (!meeting || meeting.groupId.toHexString() !== groupId) {
        throw new Error("Meeting not found.");
      }

      const group = await getGroupById(groupId);
      if (!group) {
        throw new Error("Group not found.");
      }

      const data = await buildEditableMeetingResponse(meeting, group, userId);
      res.status(200).json(data);
    }),
  );

  // PATCH /:groupId/meetings/:meetingId/edit - Autosave patch
  groupsRouter.patch(
    "/:groupId/meetings/:meetingId/edit",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const meeting = await getGroupMeetingById(meetingId);
      if (!meeting || meeting.groupId.toHexString() !== groupId) {
        throw new Error("Meeting not found.");
      }

      // Build patch from request body (only send changed fields)
      const updateInput: UpdateGroupMeetingInput = {};
      if (req.body?.name !== undefined) updateInput.name = req.body.name;
      if (req.body?.occursAt !== undefined)
        updateInput.occursAt = new Date(req.body.occursAt);
      if (req.body?.description !== undefined)
        updateInput.description = req.body.description;
      if (req.body?.address !== undefined)
        updateInput.address = req.body.address;
      if (req.body?.startTime !== undefined)
        updateInput.startTime = req.body.startTime;
      if (req.body?.durationMinutes !== undefined)
        updateInput.durationMinutes = req.body.durationMinutes;
      if (req.body?.publishEmailMessage !== undefined)
        updateInput.publishEmailMessage = req.body.publishEmailMessage;
      if (req.body?.attendanceEmailMessage !== undefined)
        updateInput.attendanceEmailMessage = req.body.attendanceEmailMessage;
      if (req.body?.publishHoursBefore !== undefined)
        updateInput.publishHoursBefore = req.body.publishHoursBefore;
      if (req.body?.notifyAttendanceHoursBefore !== undefined)
        updateInput.notifyAttendanceHoursBefore =
          req.body.notifyAttendanceHoursBefore;
      if (req.body?.endCheckinHoursBefore !== undefined)
        updateInput.endCheckinHoursBefore = req.body.endCheckinHoursBefore;

      // First verify authorization by calling the service (it will throw AuthError if not authorized)
      await buildEditableMeetingResponse(
        meeting,
        (await getGroupById(groupId)) as any,
        userId,
      );

      const updated = await updateGroupMeetingById(meetingId, updateInput);
      if (!updated) {
        throw new Error("Failed to update meeting.");
      }

      // Get updated fields list
      const updatedFields = Object.keys(updateInput).filter(
        (key) =>
          updateInput[key as keyof UpdateGroupMeetingInput] !== undefined,
      );

      const result: MeetingAutosaveResult = {
        meetingId: updated._id.toHexString(),
        savedAt: (updated.updatedAt || new Date()).toISOString(),
        status: updated.status,
        publishScheduledFor: new Date(
          updated.occursAt.getTime() -
            updated.publishHoursBefore * 60 * 60 * 1000,
        ).toISOString(),
        updatedFields,
      };

      socketGroupEmitMeetingItem(groupId, meetingId);

      res.status(200).json(result);
    }),
  );

  // POST /:groupId/meetings/:meetingId/publish - Publish draft meeting
  groupsRouter.post(
    "/:groupId/meetings/:meetingId/publish",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const meeting = await getGroupMeetingById(meetingId);
      if (!meeting || meeting.groupId.toHexString() !== groupId) {
        throw new Error("Meeting not found.");
      }

      // Verify authorization (will throw if not authorized)
      await buildEditableMeetingResponse(
        meeting,
        (await getGroupById(groupId)) as any,
        userId,
      );

      const result: PublishMeetingResult =
        await publishMeetingNowById(meetingId);

      socketGroupEmitGroupSummaryItem(groupId);
      socketGroupEmitMeetingItem(groupId, meetingId);

      res.status(200).json(result);
    }),
  );

  // POST /:groupId/meetings/:meetingId/cancel - Cancel published meeting
  groupsRouter.post(
    "/:groupId/meetings/:meetingId/cancel",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const meetingId = getRouteParam(req.params.meetingId, "meetingId");

      const meeting = await getGroupMeetingById(meetingId);
      if (!meeting || meeting.groupId.toHexString() !== groupId) {
        throw new Error("Meeting not found.");
      }

      // Verify authorization (will throw if not authorized)
      await buildEditableMeetingResponse(
        meeting,
        (await getGroupById(groupId)) as any,
        userId,
      );

      const cancelled = await cancelGroupMeetingById(meetingId);
      if (!cancelled) {
        throw new Error("Failed to cancel meeting.");
      }

      const result: CancelMeetingResult = {
        meetingId: cancelled._id.toHexString(),
        status: "cancelled",
        cancelledAt: (cancelled.cancelledAt || new Date()).toISOString(),
      };

      socketGroupEmitGroupSummaryItem(groupId);
      socketGroupEmitMeetingItem(groupId, meetingId);

      res.status(200).json(result);
    }),
  );

  groupsRouter.get(
    "/:groupId/members",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");

      const queryParams = req.query as Record<string, unknown>;

      const includeStatuses = ensureGroupMemberInviteStatuses(
        queryParams.includeStatus ??
          queryParams.includeStatuses ??
          queryParams["includeStatus[]"] ??
          queryParams["includeStatuses[]"],
      );
      const excludeStatuses = ensureGroupMemberInviteStatuses(
        queryParams.excludeStatus ??
          queryParams.excludeStatuses ??
          queryParams["excludeStatus[]"] ??
          queryParams["excludeStatuses[]"],
      );
      const cursor =
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const data = await listManagedGroupMembersPaginated({
        groupId,
        userId,
        ...(includeStatuses ? { includeStatuses } : {}),
        ...(excludeStatuses ? { excludeStatuses } : {}),
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json(data);
    }),
  );
};

applyGroupRoutes();
