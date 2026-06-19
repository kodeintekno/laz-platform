import { v2 as cloudinary } from "cloudinary";
import type { IUploadProvider, UploadFile, UploadOptions, UploadResult } from "./provider";

/**
 * Cloudinary implementation of the upload provider.
 * Uses the `CLOUDINARY_URL` env var (or individual Cloudinary env vars) for auth.
 *
 * Adaptasi dari versi Next.js: menerima { buffer, mimetype } dari multer,
 * bukan Web API File — satu-satunya kode service-layer yang tidak pindah verbatim.
 */
export class CloudinaryProvider implements IUploadProvider {
  constructor() {
    // Initialize Cloudinary configuration if not already done
    if (!cloudinary.config().cloud_name) {
      if (process.env.CLOUDINARY_URL) {
        const url = new URL(process.env.CLOUDINARY_URL);
        const apiKey = url.username;
        const apiSecret = url.password;
        cloudinary.config({
          cloud_name: url.hostname,
          api_key: apiKey,
          api_secret: apiSecret,
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
  }

  async upload(file: UploadFile, options?: UploadOptions): Promise<UploadResult> {
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
    await cloudinary.uploader.destroy(publicId);
  }
}
