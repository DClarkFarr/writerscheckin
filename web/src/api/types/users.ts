import type { AuthUser } from "../types";

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserProfileResponse {
  user: AuthUser;
}

export interface ChangeUserPasswordInput {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface ChangeUserPasswordResponse {
  message: string;
}
