import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadRoot = path.join(process.cwd(), "uploads", "characters");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
    callback(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Invalid file type"));
      return;
    }
    callback(null, true);
  },
});

export const uploadRouter = express.Router({ mergeParams: true });

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

const handleAsync =
  (handler: AsyncHandler): AsyncHandler =>
  async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid file type") {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error.message.includes("File too large")) {
          res.status(413).json({ error: "File too large" });
          return;
        }
      }
      res.status(500).json({ error: "Unexpected error" });
    }
  };

uploadRouter.post(
  "/characters",
  upload.single("file"),
  handleAsync(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "File is required" });
      return;
    }

    const url = `/uploads/characters/${req.file.filename}`;
    res.status(201).json({ url, contentType: req.file.mimetype });
  }),
);
