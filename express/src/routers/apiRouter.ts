import express from "express";
import { authRouter } from "./authRouter";
import { groupsRouter } from "./groupsRouter";
import { membersRouter } from "./membersRouter";
import { applyNestedRouter } from "../utils/routes";

// The 'mergeParams: true' option is crucial here.
// It allows the child router to access parameters from the parent route's path (e.g., :albumId).
export const apiRouter = express.Router({ mergeParams: true });

apiRouter.use(express.json({ limit: "1mb" }));
apiRouter.use(express.urlencoded({ extended: true }));

applyNestedRouter(apiRouter, "/auth", authRouter);
applyNestedRouter(apiRouter, "/groups", groupsRouter);
applyNestedRouter(apiRouter, "/members", membersRouter);
