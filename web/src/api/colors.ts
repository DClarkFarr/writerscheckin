import { apiClient } from "../lib/apiClient";
import { toApiError } from "./types";
import type { StoryColor } from "../types/color";

export type UpdateStoryColorInput = Partial<
  Pick<StoryColor, "color" | "ignored" | "sortOrder">
>;

export async function getStoryColors(storyId: string): Promise<StoryColor[]> {
  try {
    const { data } = await apiClient.get<StoryColor[]>(
      `/stories/${storyId}/colors`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateStoryColor(
  storyId: string,
  colorId: string,
  patch: UpdateStoryColorInput,
): Promise<StoryColor> {
  try {
    const { data } = await apiClient.patch<StoryColor>(
      `/stories/${storyId}/colors/${colorId}`,
      patch,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}
