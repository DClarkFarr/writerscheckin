import { apiClient } from "../lib/apiClient";
import { toApiError } from "./types";
import type {
  ChangeUserPasswordInput,
  ChangeUserPasswordResponse,
  UpdateUserProfileInput,
  UpdateUserProfileResponse,
} from "./types/users";

export async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<UpdateUserProfileResponse> {
  try {
    const { data } = await apiClient.patch<UpdateUserProfileResponse>(
      "/user/profile",
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function changeUserPassword(
  input: ChangeUserPasswordInput,
): Promise<ChangeUserPasswordResponse> {
  try {
    const { data } = await apiClient.put<ChangeUserPasswordResponse>(
      "/user/password",
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}
