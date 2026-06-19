import { api } from "@/lib/api-client";

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function handleUpload(file: File, _opts?: { folder?: string }): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResult>("/upload", formData);
  return data;
}

export async function deleteFile(publicId: string): Promise<void> {
  await api.delete(`/upload?publicId=${encodeURIComponent(publicId)}`);
}

// Named alias kept for backwards compat with ProfileCard imports
export { handleUpload as uploadImage };
