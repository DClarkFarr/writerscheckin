import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import { AuthSession } from "../services/authService";
import {
  createManagedGroup,
  listManagedGroupMeetingsPaginated,
  listManagedGroupMembersPaginated,
  getManagedGroupForm,
  leaveGroup,
  listMyMeetings,
  listMyGroupsSummary,
  searchGroupParticipants,
  updateManagedGroup,
} from "../services/groupsService";
import {
  updateGroupMemberRole,
  removeGroupMember,
} from "../services/groupMembersService";
import {
  createUpcomingMeetingFromDefaults,
  buildMeetingDetailResponse,
  buildEditableMeetingResponse,
  type MeetingAutosaveResult,
  type PublishMeetingResult,
} from "../services/groupMeetingsService";
import { updateMeetingCheckin } from "../services/meetingCheckinService";
import { GroupMemberInviteStatus } from "../models/groupModelCommon";
import { decodeCursor } from "../utils/pagination";
import {
  getGroupMeetingById,
  updateGroupMeetingById,
  publishGroupMeetingById,
} from "../models/groupMeetings";
import { getGroupById } from "../models/groups";

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
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const data = await listMyMeetings({
        userId,
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

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

      const data = await updateMeetingCheckin({
        meetingId,
        userId,
        state: stateRaw,
      });

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
          publicMessage: req.body?.publicMessage,
          attendanceMessage: req.body?.attendanceMessage,
          members: Array.isArray(req.body?.members) ? req.body.members : [],
        },
        userId,
      );

      res.status(200).json(data);
    }),
  );

  groupsRouter.patch(
    "/:id/leave",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.id, "id");

      await leaveGroup(groupId, userId);

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

      res.status(200).json({
        success: true,
        message: "Member removed",
        memberStatus: "removed",
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
      const updateInput: any = {};
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
        (key) => updateInput[key] !== undefined,
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

      // Check if draft
      if (meeting.status !== "draft") {
        throw new Error("Only draft meetings can be published.");
      }

      const published = await publishGroupMeetingById(meetingId);
      if (!published) {
        throw new Error("Failed to publish meeting.");
      }

      const result: PublishMeetingResult = {
        meetingId: published._id.toHexString(),
        status: "published",
        publishedAt: (published.updatedAt || new Date()).toISOString(),
        attendanceEnabled: true,
      };

      res.status(200).json(result);
    }),
  );

  groupsRouter.get(
    "/:groupId/members",
    handleAsync(async (req, res) => {
      const userId = getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
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
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json(data);
    }),
  );
};

applyGroupRoutes();
