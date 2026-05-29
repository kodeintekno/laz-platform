"use server";
import type { UploadResult } from "./provider";
import { logger } from "@/lib/logger";
// CloudinaryProvider is loaded dynamically within deleteFile to keep it server‑only

/**
 * Options accepted by the upload service – folder is optional and an AbortSignal can be provided.
 */
export interface UploadOptions {
  folder?: string;
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

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const absoluteUrl = base ? `${base}/api/upload` : `http://localhost:${process.env.PORT || 3000}/api/upload`;
  const response = await fetch(absoluteUrl, {
    method: "POST",
    body: form,
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
  // Load provider only on the server
  const { CloudinaryProvider } = await import("./cloudinaryProvider");
  const provider = new CloudinaryProvider();
  try {
    await provider.delete(publicId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Delete failed: ${msg}`);
  }
}
