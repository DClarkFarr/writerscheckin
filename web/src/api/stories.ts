import { apiClient } from "../lib/apiClient";
import {
  toApiError,
  type Character,
  type CharacterResponse,
  type CharactersResponse,
  type CreateCharacterInput,
  type CreateSceneInput,
  type CreateTagInput,
  type CreateSectionInput,
  type DeletePlotResponse,
  type DeleteSceneResponse,
  type DeleteSectionResponse,
  type ImportCharactersInput,
  type ImportCharactersResponse,
  type ImportTagsInput,
  type ImportTagsResponse,
  type ImportOutlineInput,
  type ImportOutlineResponse,
  type ShiftedResources,
  type StoryGridShiftInput,
  type StoryGridShiftResponse,
  type UpdateTagInput,
  type UpdateSectionInput,
  type CreatePlotInput,
  type Plot,
  type PlotResponse,
  type PlotsResponse,
  type Scene,
  type ScenesResponse,
  type SceneResponse,
  type Section,
  type SectionResponse,
  type SectionsResponse,
  type Tag,
  type TagResponse,
  type TagsResponse,
  type Story,
  type StoryResponse,
  type StoriesResponse,
  type UpdateCharacterInput,
  type UpdateSceneInput,
  type UpdatePlotInput,
} from "./types";

export interface CreateStoryInput {
  title: string;
}

export interface UpdateStoryInput {
  title?: string;
  description?: string;
}

export interface MoveSingleSceneWithinPlotInput {
  storyId: string;
  fromPlotId: string;
  toPlotId: string;
  sceneId: string;
  fromIndex: number;
  toIndex: number;
}

export async function listStories(): Promise<Story[]> {
  try {
    const { data } = await apiClient.get<StoriesResponse>("/stories");
    return data.stories;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  try {
    const { data } = await apiClient.post<StoryResponse>("/stories", input);
    return data.story;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function getStory(storyId: string): Promise<Story> {
  try {
    const { data } = await apiClient.get<StoryResponse>(`/stories/${storyId}`);
    return data.story;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteStory(storyId: string): Promise<void> {
  try {
    await apiClient.delete(`/stories/${storyId}`);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function shiftStoryGrid(
  storyId: string,
  input: StoryGridShiftInput,
): Promise<StoryGridShiftResponse> {
  try {
    const { data } = await apiClient.post<StoryGridShiftResponse>(
      `/stories/${storyId}/grid-shift`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function listStoryTags(storyId: string): Promise<Tag[]> {
  try {
    const { data } = await apiClient.get<TagsResponse>(
      `/stories/${storyId}/tags`,
    );
    return data.tags;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function importStoryTags(
  input: ImportTagsInput,
): Promise<ImportTagsResponse> {
  try {
    const { data } = await apiClient.post<ImportTagsResponse>(
      `/stories/${input.toStoryId}/tags/import`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function importStoryCharacters(
  input: ImportCharactersInput,
): Promise<ImportCharactersResponse> {
  try {
    const { data } = await apiClient.post<ImportCharactersResponse>(
      `/stories/${input.toStoryId}/characters/import`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function importStoryOutline(
  input: ImportOutlineInput,
): Promise<ImportOutlineResponse> {
  try {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("mode", input.mode);
    if (input.importType) {
      formData.append("importType", input.importType);
    }
    if (input.storyName) {
      formData.append("storyName", input.storyName);
    }
    if (input.customizations) {
      formData.append("customizations", JSON.stringify(input.customizations));
    }

    const { data } = await apiClient.post<ImportOutlineResponse>(
      "/imports/outline",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function listStoryCharacters(
  storyId: string,
): Promise<Character[]> {
  try {
    const { data } = await apiClient.get<CharactersResponse>(
      `/stories/${storyId}/characters`,
    );
    return data.characters;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createTag(
  storyId: string,
  input: CreateTagInput,
): Promise<Tag> {
  try {
    const { data } = await apiClient.post<TagResponse>(
      `/stories/${storyId}/tags`,
      input,
    );
    return data.tag;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteTag(storyId: string, tagId: string): Promise<void> {
  try {
    await apiClient.delete<void>(`/stories/${storyId}/tags/${tagId}`);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateTag(
  storyId: string,
  tagId: string,
  input: UpdateTagInput,
): Promise<Tag> {
  try {
    const { data } = await apiClient.patch<TagResponse>(
      `/stories/${storyId}/tags/${tagId}`,
      input,
    );
    return data.tag;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function addTagVariant(
  storyId: string,
  tagId: string,
  name: string,
): Promise<Tag> {
  try {
    const { data } = await apiClient.post<TagResponse>(
      `/stories/${storyId}/tags/${tagId}/variants`,
      { name },
    );
    return data.tag;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteTagVariant(
  storyId: string,
  tagId: string,
  variantName: string,
): Promise<Tag> {
  try {
    const encoded = encodeURIComponent(variantName);
    const { data } = await apiClient.delete<TagResponse>(
      `/stories/${storyId}/tags/${tagId}/variants/${encoded}`,
    );
    return data.tag;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createCharacter(
  storyId: string,
  input: CreateCharacterInput,
): Promise<Character> {
  try {
    const { data } = await apiClient.post<CharacterResponse>(
      `/stories/${storyId}/characters`,
      input,
    );
    return data.character;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateCharacter(
  storyId: string,
  characterId: string,
  input: UpdateCharacterInput,
): Promise<Character> {
  try {
    const { data } = await apiClient.patch<CharacterResponse>(
      `/stories/${storyId}/characters/${characterId}`,
      input,
    );
    return data.character;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteCharacter(
  storyId: string,
  characterId: string,
): Promise<void> {
  try {
    await apiClient.delete<void>(
      `/stories/${storyId}/characters/${characterId}`,
    );
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function listStoryPlots(storyId: string): Promise<Plot[]> {
  try {
    const { data } = await apiClient.get<PlotsResponse>(
      `/stories/${storyId}/plots`,
    );
    return data.plots;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function listStoryScenes(storyId: string): Promise<Scene[]> {
  try {
    const { data } = await apiClient.get<ScenesResponse>(
      `/stories/${storyId}/scenes`,
    );
    return data.scenes;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function listStorySections(storyId: string): Promise<Section[]> {
  try {
    const { data } = await apiClient.get<SectionsResponse>(
      `/stories/${storyId}/sections`,
    );
    return data.sections;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createPlot(
  storyId: string,
  input: CreatePlotInput,
): Promise<Plot> {
  try {
    const { data } = await apiClient.post<PlotResponse>(
      `/stories/${storyId}/plots`,
      input,
    );
    return data.plot;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createSection(
  storyId: string,
  input: CreateSectionInput,
): Promise<SectionResponse> {
  try {
    const { data } = await apiClient.post<SectionResponse>(
      `/stories/${storyId}/sections`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateSection(
  storyId: string,
  sectionId: string,
  input: UpdateSectionInput,
): Promise<SectionResponse> {
  try {
    const { data } = await apiClient.patch<SectionResponse>(
      `/stories/${storyId}/sections/${sectionId}`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export interface MoveSectionInput {
  toIndex: number;
}

export async function moveSection(
  storyId: string,
  sectionId: string,
  input: MoveSectionInput,
): Promise<SectionResponse> {
  try {
    const { data } = await apiClient.post<SectionResponse>(
      `/stories/${storyId}/sections/${sectionId}/move-section`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteSection(
  storyId: string,
  sectionId: string,
): Promise<DeleteSectionResponse> {
  try {
    const { data } = await apiClient.delete<DeleteSectionResponse>(
      `/stories/${storyId}/sections/${sectionId}`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updatePlot(
  storyId: string,
  plotId: string,
  input: UpdatePlotInput,
): Promise<Plot> {
  try {
    const { data } = await apiClient.patch<PlotResponse>(
      `/stories/${storyId}/plots/${plotId}`,
      input,
    );
    return data.plot;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deletePlot(
  storyId: string,
  plotId: string,
): Promise<DeletePlotResponse> {
  try {
    const { data } = await apiClient.delete<DeletePlotResponse>(
      `/stories/${storyId}/plots/${plotId}`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function createScene(
  storyId: string,
  plotId: string,
  input: CreateSceneInput,
): Promise<SceneResponse> {
  try {
    const { data } = await apiClient.post<SceneResponse>(
      `/stories/${storyId}/plots/${plotId}/scenes`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function deleteScene(
  storyId: string,
  sceneId: string,
): Promise<DeleteSceneResponse> {
  try {
    const { data } = await apiClient.delete<DeleteSceneResponse>(
      `/stories/${storyId}/scenes/${sceneId}`,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateScene(
  storyId: string,
  sceneId: string,
  input: UpdateSceneInput,
): Promise<SceneResponse> {
  try {
    const { data } = await apiClient.patch<SceneResponse>(
      `/stories/${storyId}/scenes/${sceneId}`,
      input,
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function moveSingleSceneWithinPlot(
  input: MoveSingleSceneWithinPlotInput,
) {
  try {
    return await apiClient
      .post<{
        scene?: Scene | null;
        shiftedResources?: ShiftedResources;
      }>(
        `/stories/${input.storyId}/scenes/${input.sceneId}/move-within-plot`,
        input,
      )
      .then((res) => res.data);
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function updateStory(
  storyId: string,
  input: UpdateStoryInput,
): Promise<Story> {
  try {
    const { data } = await apiClient.patch<StoryResponse>(
      `/stories/${storyId}`,
      input,
    );
    return data.story;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function duplicateStory(storyId: string): Promise<Story> {
  try {
    const { data } = await apiClient.post<StoryResponse>(
      `/stories/${storyId}/duplicate`,
    );
    return data.story;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function exportStoryDocx(storyId: string): Promise<Blob> {
  try {
    const { data } = await apiClient.post<Blob>(
      `/stories/${storyId}/export/docx`,
      undefined,
      { responseType: "blob" },
    );
    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

const EXPORT_BASE_MS = 5_000;
const EXPORT_PER_SCENE_MS = 300;
const EXPORT_MAX_MS = 60_000;

export function computeExportToastDuration(sceneCount: number): number {
  return Math.min(
    EXPORT_BASE_MS + sceneCount * EXPORT_PER_SCENE_MS,
    EXPORT_MAX_MS,
  );
}
