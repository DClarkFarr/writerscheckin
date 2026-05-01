import { apiClient } from "../lib/apiClient";
import {
  toApiError,
  type AuthUser,
  type AuthUserResponse,
  type MessageResponse,
} from "./types";

// ─── Signup ───────────────────────────────────────────────────────────────────

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function signup(input: SignupInput): Promise<AuthUser> {
  try {
    const { data } = await apiClient.post<AuthUserResponse>(
      "/auth/signup",
      input,
    );
    return data.user;
  } catch (err) {
    throw await toApiError(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  try {
    const { data } = await apiClient.post<AuthUserResponse>(
      "/auth/login",
      input,
    );
    return data.user;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (err) {
    throw await toApiError(err);
  }
}

// ─── Reset Password Request ───────────────────────────────────────────────────

export interface ResetPasswordRequestInput {
  email: string;
}

export async function resetPasswordRequest(
  input: ResetPasswordRequestInput,
): Promise<MessageResponse> {
  try {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/reset-password/request",
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface ResetPasswordConfirmInput {
  email: string;
  code: string;
  password: string;
}

export async function resetPasswordConfirm(
  input: ResetPasswordConfirmInput,
): Promise<MessageResponse> {
  try {
    const { data } = await apiClient.post<MessageResponse>(
      "/auth/reset-password/confirm",
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getMe(): Promise<AuthUser> {
  try {
    const { data } = await apiClient.get<AuthUserResponse>("/auth/me");
    return data.user;
  } catch (err) {
    throw await toApiError(err);
  }
}
