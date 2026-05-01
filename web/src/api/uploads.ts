import axios from "axios";
import { toApiError } from "./types";

export type UploadResponse = {
  url: string;
  contentType: string;
};

const resolveUploadBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl) {
    return "";
  }

  return baseUrl.replace(/\/api\/?$/, "");
};

export async function uploadCharacterImage(
  file: File,
): Promise<UploadResponse> {
  try {
    const baseUrl = resolveUploadBaseUrl();
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axios.post<UploadResponse>(
      `${baseUrl}/uploads/characters`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}
