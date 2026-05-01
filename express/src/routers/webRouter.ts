import express from "express";
import path from "path";

// The 'mergeParams: true' option is crucial here.
// It allows the child router to access parameters from the parent route's path (e.g., :albumId).
export const webRouter = express.Router({ mergeParams: true });

const publicDir = path.resolve(process.cwd(), "..", "web", "dist");

webRouter.use(express.static(publicDir));

webRouter.get("/{*path}", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});
