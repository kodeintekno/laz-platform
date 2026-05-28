// src/components/ui/FileUpload.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FormLabel } from "./form/form-label";
import { LoadingSpinner } from "./LoadingSpinner";

interface FileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
  /**
   * Called when upload succeeds. Passes the uploaded image URL and its publicId.
   */
  onUpload: (payload: { url: string; publicId: string }) => void;
  /**
   * Called when the file is removed.
   */
  onRemove?: () => void;
  /** Initial URL for preview (e.g. when editing) */
  initialUrl?: string;
  /** Initial publicId (e.g. when editing) */
  initialPublicId?: string;
  error?: string | null;
  description?: string;
  /** Cloudinary folder to group the uploaded asset (e.g. "laz-logos") */
  folder?: string;
  /** Optional external AbortController ref to allow parent to cancel upload */
  abortRef?: React.MutableRefObject<AbortController | null>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label = "Upload",
  accept = "image/png, image/jpeg",
  disabled = false,
  onUpload,
  onRemove,
  initialUrl = "",
  initialPublicId = "",
  error = null,
  description = "",
  folder,
  abortRef,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [currentPublicId, setCurrentPublicId] = useState<string>(initialPublicId);

  // Sync state if initial values change
  useEffect(() => {
    if (initialUrl) setPreviewUrl(initialUrl);
    if (initialPublicId) setCurrentPublicId(initialPublicId);
  }, [initialUrl, initialPublicId]);

  // Use external abortRef if provided, otherwise internal one
  const internalAbortRef = React.useRef<AbortController | null>(null);
  const abortControllerRef = abortRef ?? internalAbortRef;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      console.error("File terlalu besar. Maksimum 2 MB.");
      return;
    }
    // abort any previous upload
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setUploading(true);

    // Keep track of the newly-uploaded file we need to clean up if this upload succeeds
    const oldPublicIdToDelete = (currentPublicId && currentPublicId !== initialPublicId) ? currentPublicId : null;

    console.log("handleChange: Upload starting...", {
      currentPublicId,
      initialPublicId,
      oldPublicIdToDelete
    });

    try {
      // use uploadService to handle Cloudinary upload
      const { handleUpload: upload } = await import("@/lib/upload/uploadService");
      const result = await upload(file, { 
        signal: controller.signal,
        folder: folder
      });

      console.log("handleChange: Upload succeeded", result);

      // If the new upload succeeded, delete the previous newly-uploaded file from Cloudinary
      if (oldPublicIdToDelete) {
        console.log("handleChange: Deleting replaced temporary file:", oldPublicIdToDelete);
        try {
          const { deleteFile } = await import("@/lib/upload/uploadService");
          await deleteFile(oldPublicIdToDelete);
          console.log("handleChange: Successfully deleted replaced temporary file");
        } catch (delErr) {
          console.error("Gagal menghapus file lama yang ditimpa:", delErr);
        }
      }

      setPreviewUrl(result.url);
      setCurrentPublicId(result.publicId);
      onUpload({ url: result.url, publicId: result.publicId });
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Upload dibatalkan");
      } else {
        console.error(err);
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRemove = async () => {
    // If it's a newly uploaded file in this session, delete it from Cloudinary
    const isNewUpload = currentPublicId && currentPublicId !== initialPublicId;
    if (isNewUpload) {
      setDeleting(true);
      try {
        const { deleteFile } = await import("@/lib/upload/uploadService");
        await deleteFile(currentPublicId);
      } catch (err) {
        console.error("Gagal menghapus file dari Cloudinary:", err);
      } finally {
        setDeleting(false);
      }
    }

    setPreviewUrl("");
    setCurrentPublicId("");
    onRemove?.();

    // Reset file input value so user can upload the same file again if desired
    const fileInput = document.getElementById(name) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-1.5 w-full">
      <FormLabel htmlFor={name}>
        {label}
      </FormLabel>
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled || uploading || deleting}
        onChange={handleChange}
        className="block w-full rounded-xl border border-border/40 shadow-sm py-2.5 px-4 text-primary bg-surface placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-primary/30 focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6"
      />

      {uploading && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-primary mb-2">Pratinjau:</p>
          <div className="h-24 w-24 rounded-xl border border-border/40 bg-surface-soft animate-pulse flex items-center justify-center">
            <LoadingSpinner size="sm" className="border-t-brand-primary" />
          </div>
        </div>
      )}

      {previewUrl && !uploading && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-primary mb-2">Pratinjau:</p>
          <div className="relative w-24 h-24 rounded-xl border border-border/40 bg-surface-soft p-1.5 shadow-sm overflow-visible flex items-center justify-center group hover:shadow-md transition-all duration-200">
            <img
              src={previewUrl}
              alt="Preview"
              className={`max-w-full max-h-full object-contain rounded-lg ${
                deleting ? "opacity-40" : ""
              }`}
            />
            {deleting ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/70 rounded-xl">
                <LoadingSpinner size="sm" className="border-t-destructive" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading || deleting}
                className="absolute -top-2.5 -right-2.5 bg-destructive hover:bg-destructive/95 text-white rounded-full p-1 shadow-md hover:scale-110 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:scale-100 flex items-center justify-center cursor-pointer z-10"
                title="Batalkan & Hapus gambar"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}
      {description && (
        <p className="text-[11px] text-muted leading-tight mt-1">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};
