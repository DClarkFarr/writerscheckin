import { Request } from "express";
import { normalizeEmail } from "../models/users";
import { AuthError, ValidationError } from "../services/authService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requireString = (value: unknown, label: string): string => {
  if (typeof value !== "string") {
    throw new ValidationError(label, `${label} is required`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(label, `${label} is required`);
  }

  return trimmed;
};

export const optionalString = (
  value: unknown,
  label: string,
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(label, `${label} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new ValidationError(label, `${label} is required`);
  }

  return trimmed;
};

export const validateEmail = (value: unknown): string => {
  const raw = requireString(value, "email");
  const normalized = normalizeEmail(raw);

  if (!emailRegex.test(normalized)) {
    throw new ValidationError("email", "Invalid email");
  }

  return normalized;
};

export const validatePassword = (value: unknown): string => {
  const password = requireString(value, "password");

  if (password.length < 5 || password.length > 128) {
    throw new ValidationError("password", "Password must be 5-128 characters");
  }

  return password;
};

export const validateName = (value: unknown, label: string): string => {
  const name = requireString(value, label);

  if (name.length > 80) {
    throw new ValidationError(label, `${label} is too long`);
  }

  return name;
};

export const validateToken = (value: unknown): string => {
  const token = requireString(value, "token");

  if (token.length < 16) {
    throw new ValidationError("token", "Invalid token");
  }

  return token;
};

export const validateResetCode = (value: unknown): string => {
  const code = requireString(value, "code");

  if (!/^\d{6}$/.test(code)) {
    throw new ValidationError("code", "Code must be a 6-digit number");
  }

  return code;
};

type SessionWithUser = Request & {
  session?: {
    userId?: string;
  };
};

export const requireUserId = (req: Request): string => {
  const session = (req as SessionWithUser).session;
  if (!session?.userId) {
    throw new AuthError("Unauthorized", 401);
  }

  return session.userId;
};

export const requireNumber = (value: unknown, label: string): number => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || Number.isNaN(parsed)) {
    throw new ValidationError(label, `${label} is required`);
  }

  return parsed;
};

export const optionalNumber = (
  value: unknown,
  label: string,
): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || Number.isNaN(parsed)) {
    throw new ValidationError(label, `${label} must be a number`);
  }

  return parsed;
};

export const requireStringArray = (value: unknown, label: string): string[] => {
  if (!Array.isArray(value)) {
    throw new ValidationError(label, `${label} must be an array`);
  }

  return value.map((entry, index) =>
    requireString(entry, `${label}[${index}]`),
  );
};

export const optionalStringArray = (
  value: unknown,
  label: string,
): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return requireStringArray(value, label);
};

export const resolveOwnerId = (
  users: Array<{ userId: { toHexString(): string }; role: string }>,
): string => {
  const owner = users.find((permission) => permission.role === "owner");
  if (!owner) {
    return users[0]?.userId.toHexString() ?? "";
  }

  return owner.userId.toHexString();
};
