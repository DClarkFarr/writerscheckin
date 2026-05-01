import crypto from "crypto";
import session from "express-session";
import { ObjectId } from "mongodb";
import { getUserByEmail, getUserById } from "../models/users";
import {
  createPasswordReset,
  getLatestActivePasswordResetByUserId,
  invalidateActivePasswordResetsByUserId,
  markPasswordResetUsed,
} from "../models/passwordResets";
import { createUser, updateUserById } from "./userService";
import { endSessionsByUserId } from "./sessionService";
import {
  assertAuthAttemptAllowed,
  recordAuthAttempt,
  resetAuthAttempt,
} from "./authAttemptService";
import { hashPassword, verifyPassword } from "../utils/passwords";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateResetCode,
} from "../utils/validators";
import { recordAuditEvent } from "../utils/audit";
import { sendEmail } from "./emailService";
import { buildPasswordResetEmail } from "./emailTemplates/passwordResetEmail";

export class AuthError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export class ValidationError extends Error {
  public readonly status: number;
  public readonly field: string;

  public constructor(field: string, message: string) {
    super(message);
    this.field = field;
    this.name = "ValidationError";
    this.status = 400;
  }
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type AuthSession = session.Session &
  session.SessionData & {
    userId?: string;
  };

const toAuthUser = (user: {
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
}): AuthUserResponse => ({
  id: user._id.toHexString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});

const saveSession = (sessionData: AuthSession): Promise<void> =>
  new Promise((resolve, reject) => {
    sessionData.save((error: Error | null) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const getResetExpiry = (): Date => new Date(Date.now() + 60 * 60 * 1000);

const RESET_CODE_LENGTH = 6;

const hashResetCode = (code: string): string =>
  crypto.createHash("sha256").update(code).digest("hex");

const generateResetCode = (): string =>
  crypto
    .randomInt(0, 10 ** RESET_CODE_LENGTH)
    .toString()
    .padStart(6, "0");

const isCodeMatch = (expectedHash: string, providedCode: string): boolean => {
  const providedHash = hashResetCode(providedCode);

  const expected = Buffer.from(expectedHash, "hex");
  const provided = Buffer.from(providedHash, "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
};

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  ipAddress?: string;
}

export const signup = async (
  input: SignupInput,
  sessionData: AuthSession,
): Promise<AuthUserResponse> => {
  const firstName = validateName(input.firstName, "firstName");

  const lastName = validateName(input.lastName, "lastName");
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const ipAddress = input.ipAddress ?? "unknown";

  await assertAuthAttemptAllowed(email, ipAddress, "signup");
  await recordAuthAttempt(email, ipAddress, "signup");

  const passwordHash = await hashPassword(password);
  const passwordChangedAt = new Date();

  const user = await createUser({
    firstName,
    lastName,
    email,
    passwordHash,
    passwordChangedAt,
  });

  await resetAuthAttempt(email, ipAddress, "signup");

  sessionData.userId = user._id.toHexString();
  await saveSession(sessionData);

  recordAuditEvent({
    action: "signup",
    userId: user._id.toHexString(),
    email: user.email,
    ipAddress,
  });

  return toAuthUser(user);
};

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
}

export const login = async (
  input: LoginInput,
  sessionData: AuthSession,
): Promise<AuthUserResponse> => {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const ipAddress = input.ipAddress ?? "unknown";

  await assertAuthAttemptAllowed(email, ipAddress, "login");

  const user = await getUserByEmail(email);
  const isValid = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !isValid) {
    await recordAuthAttempt(email, ipAddress, "login");
    throw new AuthError("Invalid credentials", 401);
  }

  await resetAuthAttempt(email, ipAddress, "login");

  sessionData.userId = user._id.toHexString();
  await saveSession(sessionData);

  recordAuditEvent({
    action: "login",
    userId: user._id.toHexString(),
    email: user.email,
    ipAddress,
  });

  return toAuthUser(user);
};

export interface ResetRequestInput {
  email: string;
  ipAddress?: string;
}

export const requestPasswordReset = async (
  input: ResetRequestInput,
): Promise<void> => {
  const email = validateEmail(input.email);
  const ipAddress = input.ipAddress ?? "unknown";

  await assertAuthAttemptAllowed(email, ipAddress, "reset");
  await recordAuthAttempt(email, ipAddress, "reset");

  const user = await getUserByEmail(email);
  if (!user) {
    return;
  }

  await invalidateActivePasswordResetsByUserId(user._id);

  const code = generateResetCode();
  const codeHash = hashResetCode(code);

  await createPasswordReset({
    userId: user._id,
    codeHash,
    expiresAt: getResetExpiry(),
  });

  const resetEmail = buildPasswordResetEmail({
    firstName: user.firstName,
    resetCode: code,
    expiresInMinutes: 60,
  });

  await sendEmail({
    to: user.email,
    subject: resetEmail.subject,
    text: resetEmail.text,
    html: resetEmail.html,
  });

  recordAuditEvent({
    action: "reset-request",
    userId: user._id.toHexString(),
    email: user.email,
    ipAddress,
  });

  if (process.env.MODE !== "production") {
    console.info("Password reset code", { email, code });
  }
};

export interface ResetConfirmInput {
  email: string;
  code: string;
  password: string;
  ipAddress?: string;
}

export const confirmPasswordReset = async (
  input: ResetConfirmInput,
): Promise<void> => {
  const email = validateEmail(input.email);
  const code = validateResetCode(input.code);
  const password = validatePassword(input.password);
  const ipAddress = input.ipAddress ?? "unknown";

  await assertAuthAttemptAllowed(email, ipAddress, "reset");
  await recordAuthAttempt(email, ipAddress, "reset");

  const user = await getUserByEmail(email);
  if (!user) {
    throw new AuthError("Invalid or expired code", 401);
  }

  const reset = await getLatestActivePasswordResetByUserId(user._id);
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
    throw new AuthError("Invalid or expired code", 401);
  }

  if (!isCodeMatch(reset.codeHash, code)) {
    throw new AuthError("Invalid or expired code", 401);
  }

  const passwordHash = await hashPassword(password);
  const passwordChangedAt = new Date();

  await updateUserById(user._id, {
    passwordHash,
    passwordChangedAt,
  });

  await resetAuthAttempt(email, ipAddress, "reset");
  await markPasswordResetUsed(reset._id);
  await endSessionsByUserId(user._id);

  const auditEvent = {
    action: "reset-confirm" as const,
    userId: user._id.toHexString(),
    email: user.email,
    ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
  };

  recordAuditEvent(auditEvent);
};

export const getCurrentUser = async (
  sessionData: AuthSession,
): Promise<AuthUserResponse> => {
  if (!sessionData.userId) {
    throw new AuthError("Unauthorized", 401);
  }

  const user = await getUserById(sessionData.userId);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  return toAuthUser(user);
};
