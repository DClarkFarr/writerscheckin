import type { AuthUserResponse } from "../authService";

export interface UpdateProfileForSessionInput {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
}

export interface ChangePasswordForSessionInput {
  currentPassword?: unknown;
  newPassword?: unknown;
  newPasswordConfirm?: unknown;
  email?: unknown;
}

export interface UpdateProfileForSessionResponse {
  user: AuthUserResponse;
}

export interface ChangePasswordForSessionResponse {
  message: string;
}
