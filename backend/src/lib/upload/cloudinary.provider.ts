import { ForbiddenException, Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { IUploadProvider, UploadFile, UploadOptions, UploadOwner, UploadResult } from "./provider";

/**
 * Cloudinary implementation of the upload provider.
 * Uses the `CLOUDINARY_URL` env var (or individual Cloudinary env vars) for auth.
 *
 * Configuration is validated lazily (on first actual upload/delete call), not
 * in the constructor — this provider is now DI-injected and instantiated
 * eagerly at Nest bootstrap, so throwing here would crash app startup
 * whenever Cloudinary env vars are unset (e.g. local dev without uploads).
 */
@Injectable()
export class CloudinaryProvider implements IUploadProvider {
  private ensureConfigured(): void {
    if (cloudinary.config().cloud_name) return;

    if (process.env.CLOUDINARY_URL) {
      const url = new URL(process.env.CLOUDINARY_URL);
      cloudinary.config({
        cloud_name: url.hostname,
        api_key: url.username,
        api_secret: url.password,
        secure: true,
      });
    } else if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      throw new Error("Cloudinary configuration is missing in environment variables");
    }
  }

  async upload(file: UploadFile, options?: UploadOptions): Promise<UploadResult> {
    this.ensureConfigured();
    const folder = options?.folder ?? "";
    const transformation = options?.transformation;

    // Stream the binary buffer directly. Encoding it as a base64 data URI adds
    // roughly 33% to the request body, so a valid file below our 10 MB limit
    // can be rejected by an upstream/provider request-size limit.
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation,
          // Let Cloudinary route images and PDFs to the appropriate resource type.
          resource_type: "auto",
          // Ownership comes only from the server principal, never the folder
          // or an attachment URL. Never overwrite another asset's ownership.
          overwrite: false,
          context: {
            laz_owner_version: "1",
            ...(options?.owner?.userId ? { laz_owner_user: options.owner.userId } : {}),
            ...(options?.owner?.lembagaId ? { laz_owner_lembaga: options.owner.lembagaId } : {}),
          },
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary did not return an upload result"));
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type as string,
    };
  }

  async delete(publicId: string, owner: UploadOwner): Promise<void> {
    if (!owner || (!owner.userId && !owner.lembagaId) || typeof publicId !== "string" || !publicId) {
      throw new ForbiddenException("Kepemilikan file tidak dapat diverifikasi");
    }
    this.ensureConfigured();
    for (const resourceType of ["image", "raw"] as const) {
      let asset;
      try {
        asset = await cloudinary.api.resource(publicId, { resource_type: resourceType, context: true });
      } catch (error) {
        // Only a confirmed missing resource permits checking the other type.
        const missing = error as { http_code?: number; error?: { http_code?: number } };
        if (missing?.http_code === 404 || missing?.error?.http_code === 404) continue;
        throw error;
      }
      const ownership = asset.context?.custom;
      const allowed = ownership?.laz_owner_version === "1" && (
        ownership.laz_owner_lembaga
          ? ownership.laz_owner_lembaga === owner.lembagaId
          : !!owner.userId && ownership.laz_owner_user === owner.userId
      );
      // Legacy/pre-login uploads have no trusted owner. Retain them rather
      // than inferring ownership from caller-controlled stored references.
      if (!allowed || asset.public_id !== publicId || asset.resource_type !== resourceType) {
        throw new ForbiddenException("Anda tidak memiliki izin untuk menghapus file ini");
      }
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result.result !== "not found") return;
    }
  }
}
