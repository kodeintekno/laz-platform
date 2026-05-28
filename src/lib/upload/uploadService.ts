import type { UploadResult } from "./provider";
import { logger } from "@/lib/logger";

/**
 * Options accepted by the upload service – folder is optional and an AbortSignal can be provided.
 */
export interface UploadOptions {
  folder?: string;
  signal?: AbortSignal;
}

/**
 * Upload a file to the server‑side `/api/upload` endpoint.
 * The endpoint returns an object `{ url, publicId }`.
 */
export async function handleUpload(
  file: File,
  opts?: UploadOptions
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (opts?.folder) form.append("folder", opts.folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: form,
    signal: opts?.signal,
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Upload failed: ${txt}`);
  }
  return response.json(); // { url, publicId }
}

/**
 * Replace an existing uploaded file with a new one.
 * After a successful upload the old asset (if any) is deleted.
 */
export async function replaceFile(
  oldPublicId: string | null,
  file: File,
  opts?: UploadOptions
): Promise<UploadResult> {
  const newResult = await handleUpload(file, opts);
  if (oldPublicId) {
    try {
      await deleteFile(oldPublicId);
    } catch (e) {
      logger.error({ err: e }, "Failed to delete old file");
    }
  }
  return newResult;
}

/** Delete a stored asset by its publicId via the server route. */
export async function deleteFile(publicId: string): Promise<void> {
  const response = await fetch(
    `/api/upload?publicId=${encodeURIComponent(publicId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Delete failed: ${txt}`);
  }
}
