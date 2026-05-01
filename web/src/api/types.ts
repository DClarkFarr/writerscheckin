import type { AxiosError } from "axios";
import axios from "axios";

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface StoryStats {
  plots: number;
  scenes: number;
  characters: number;
  tags: number;
}

export interface Story {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  stats: StoryStats;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  variant: boolean;
  variants: string[];
  storyId: string;
}

export interface Character {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  characteristics: CharacteristicFields | null;
  customCharacteristics: CharacterCustomAttribute[];
  lists: CharacterList[];
}

export interface CharacteristicFields {
  description?: string;
  history?: string;
  height?: string;
  weight?: string;
  age?: string;
  hair?: string;
  eyeColor?: string;
  mantra?: string;
  skinColor?: string;
  build?: string;
}

export interface CharacterCustomAttribute {
  label: string;
  value: string;
}

export interface CharacterList {
  label: string;
  items: string[];
}

export interface CreateCharacterInput {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  characteristics?: CharacteristicFields;
  customCharacteristics?: CharacterCustomAttribute[];
  lists?: CharacterList[];
}

export interface UpdateCharacterInput {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  characteristics?: CharacteristicFields;
  customCharacteristics?: CharacterCustomAttribute[];
  lists?: CharacterList[];
}

export interface DeleteCharacterInput {
  storyId: string;
  characterId: string;
}

export interface ImportCharactersInput {
  fromStoryId: string;
  toStoryId: string;
  characterIds: string[];
}

export type ImportOutlineMode = "preview" | "create";
export type ImportOutlineType = "legacy" | "modern";

export interface ImportPlotCustomization {
  id: string;
  name: string;
  color: string;
  isDefaultPlot: boolean;
  ignored: boolean;
}

export interface ImportCustomizations {
  ignoredCharacterIds: string[];
  characterMerges: Record<string, string>;
  plots: ImportPlotCustomization[];
}

export interface ImportOutlineInput {
  mode: ImportOutlineMode;
  importType?: ImportOutlineType;
  file: File;
  storyName?: string;
  customizations?: ImportCustomizations | null;
}

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface ImportTagsInput {
  fromStoryId: string;
  toStoryId: string;
  tagIds: string[];
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  variant?: boolean;
  variants?: string[];
}

export interface SceneTodoItem {
  text: string;
  isDone: boolean;
}

export interface SceneSnippet {
  label: string;
  text: string;
}

export interface DeleteTagInput {
  storyId: string;
  tagId: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  plotId: string;
  tags: string[];
  tagVariants?: SceneTagVariant[];
  todo: SceneTodoItem[];
  snippets: SceneSnippet[];
  scene: string | null;
  verticalIndex: number;
  pov: string | null;
}

export interface SceneTagVariant {
  tagId: string;
  variant: string;
}

export type SectionType = "act" | "chapter";

export interface Section {
  id: string;
  storyId: string;
  title: string;
  verticalIndex: number;
  type: SectionType;
  description?: string | null;
}

export interface ShiftedResources {
  scenes: Scene[];
  sections: Section[];
}

export interface Plot {
  id: string;
  title: string;
  description: string;
  color: string;
  storyId: string;
  horizontalIndex: number;
}

export interface CreatePlotInput {
  title: string;
  description: string | undefined;
  color: string;
  horizontalIndex: number;
}

export interface UpdatePlotInput {
  title?: string;
  description?: string;
  color?: string;
  horizontalIndex?: number;
}

export interface CreateSceneInput {
  title: string;
  description: string;
  plotId: string;
  scene?: string | null;
  tags?: string[];
  tagVariants?: SceneTagVariant[];
  todo?: SceneTodoItem[];
  snippets?: SceneSnippet[];
  verticalIndex: number;
  pov?: string | null;
}

export interface UpdateSceneInput {
  title?: string;
  description?: string;
  scene?: string | null;
  tags?: string[];
  tagVariants?: SceneTagVariant[];
  todo?: SceneTodoItem[];
  snippets?: SceneSnippet[];
  verticalIndex?: number;
  pov?: string | null;
}

export interface CreateSectionInput {
  title: string;
  verticalIndex: number;
  type: SectionType;
  description?: string;
}

export interface UpdateSectionInput {
  title?: string;
  verticalIndex?: number;
  type?: SectionType;
  description?: string;
}

export interface StoryGridShiftInput {
  startIndex: number;
  shift: number;
}

// ─── Response Envelopes ───────────────────────────────────────────────────────

export interface AuthUserResponse {
  user: AuthUser;
}

export interface StoryResponse {
  story: Story;
}

export interface StoriesResponse {
  stories: Story[];
}

export interface TagsResponse {
  tags: Tag[];
}

export interface ImportTagsResponse {
  createdTags: Tag[];
  skippedTagIds: string[];
}

export interface ImportCharactersResponse {
  createdCharacters: Character[];
  skippedCharacterIds: string[];
}

export interface ImportOutlineParseTag {
  id: string;
  name: string;
  variant: string | null;
  color: string | null;
  isDefaultPlot: boolean | undefined;
}

export interface ImportOutlineParsePlot {
  id: string;
  name: string;
  color: string | null;
}

export interface ImportOutlineParseCharacter {
  id: string;
  name: string;
}

export interface ImportOutlineParseIssue {
  level: "error" | "warning";
  message: string;
  location?: string | null;
}

export interface ImportOutlineParseActElement {
  id: string;
  type: "act";
  title: string;
  content: string[];
}

export interface ImportOutlineParseChapterElement {
  id: string;
  type: "chapter";
  title: string;
  content: string[];
}

export interface ImportOutlineParseSceneElement {
  id: string;
  type: "scene";
  title: string;
  povCharacterId: string | null;
  tagIds: string[];
  plotIds?: string[];
  characterIds: string[];
  content: string[];
}

export type ImportOutlineParseElement =
  | ImportOutlineParseActElement
  | ImportOutlineParseChapterElement
  | ImportOutlineParseSceneElement;

export interface ImportOutlineNormalizationItem {
  canonicalName: string;
  rawVariants: string[];
  consolidatedCount: number;
  reusedExisting: boolean;
}

export interface ImportOutlineNormalizationCounts {
  tagVariantsConsolidated: number;
  characterVariantsConsolidated: number;
  newNamesCreated: number;
  existingNamesReused: number;
}

export interface ImportOutlineNormalizationReport {
  tags: ImportOutlineNormalizationItem[];
  characters: ImportOutlineNormalizationItem[];
  counts: ImportOutlineNormalizationCounts;
}

export interface ImportOutlineResponse {
  mode: ImportOutlineMode;
  storyName: string;
  summary: string;
  message?: string | null;
  storyId?: string | null;
  elements?: ImportOutlineParseElement[];
  tags?: ImportOutlineParseTag[];
  plots?: ImportOutlineParsePlot[];
  characters?: ImportOutlineParseCharacter[];
  issues?: ImportOutlineParseIssue[];
  normalization?: ImportOutlineNormalizationReport;
}

export interface CharactersResponse {
  characters: Character[];
}

export interface CharacterResponse {
  character: Character;
}

export interface TagResponse {
  tag: Tag;
}

export interface PlotsResponse {
  plots: Plot[];
}

export interface ScenesResponse {
  scenes: Scene[];
}

export interface PlotResponse {
  plot: Plot;
}

export interface SceneResponse {
  scene: Scene;
  shiftedResources?: ShiftedResources;
}

export interface SectionsResponse {
  sections: Section[];
}

export interface SectionResponse {
  section: Section;
  shiftedResources?: ShiftedResources;
}

export interface StoryGridShiftResponse {
  shiftedResources?: ShiftedResources;
}

export interface DeleteSceneResponse {
  deleted: true;
  shiftedResources?: ShiftedResources;
}

export interface DeleteStoryResponse {
  deleted: true;
}

export interface DeleteSectionResponse {
  deleted: true;
  shiftedResources?: ShiftedResources;
}

export interface DeletePlotResponse {
  deleted: true;
  deletedPlotId: string;
  targetPlotId: string;
  movedSceneCount: number;
}

export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly serverMessage: string;

  constructor(status: number, serverMessage: string) {
    super(serverMessage);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

// ─── Axios Error Normaliser ───────────────────────────────────────────────────

export async function toApiError(err: unknown): Promise<ApiError> {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;
    const status = axiosErr.response?.status ?? 0;

    if (axiosErr.response?.data instanceof Blob) {
      const text = await axiosErr.response?.data;
      try {
        const json = JSON.parse(text as unknown as string);
        if (json?.message || json?.error) {
          return new ApiError(
            status,
            json?.message ?? json?.error ?? axiosErr.message ?? "Network error",
          );
        }
      } catch {
        // nothing
      }
    }
    const message =
      axiosErr.response?.data?.message ??
      axiosErr.response?.data?.error ??
      axiosErr.message ??
      "Network error";
    return new ApiError(status, message);
  }
  if (err instanceof ApiError) {
    return err;
  }
  return new ApiError(0, "Unexpected error");
}
