import express, { Request } from "express";
import { handleAsync } from "../utils/asyncHandler";
import { AuthSession } from "../services/authService";
import {
  createManagedGroup,
  getManagedGroupForm,
  leaveGroup,
  listMyGroupsSummary,
  searchGroupParticipants,
  updateManagedGroup,
} from "../services/groupsService";
import {
  updateGroupMemberRole,
  removeGroupMember,
} from "../services/groupMembersService";
import { createUpcomingMeetingFromDefaults } from "../services/groupMeetingsService";

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
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const parsedLimit =
        typeof req.query.limit === "string"
          ? Number.parseInt(req.query.limit, 10)
          : undefined;
      const limit =
        typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
          ? parsedLimit
          : undefined;

      const data = await listMyGroupsSummary({
        userId,
        ...(cursor ? { cursor } : {}),
        ...(typeof limit === "number" ? { limit } : {}),
      });

      res.status(200).json({ items: data.items, nextCursor: data.nextCursor });
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
      getAuthenticatedUserId(req);
      const groupId = getRouteParam(req.params.groupId, "groupId");
      const cursor = req.query.cursor?.toString();
      const futureOnly = getRouteBooleanParam(
        req.query.futureOnly?.toString(),
        "futureOnly",
      );
      const pastOnly = getRouteBooleanParam(
        req.query.pastOnly?.toString(),
        "pastOnly",
      );
    }),
  );
};

applyGroupRoutes();
