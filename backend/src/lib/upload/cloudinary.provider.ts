import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import type { IUploadProvider, UploadFile, UploadOptions, UploadResult } from "./provider";

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

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      transformation,
    });
    return { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  }

  async delete(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}
