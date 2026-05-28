import { CloudinaryProvider } from "./cloudinaryProvider";
import { IUploadProvider } from "./provider";

/**
 * Returns an instance of the configured storage provider.
 * Currently only "cloudinary" is supported, but the switch makes it trivial
 * to add S3, Azure, etc. in the future.
 */
export function getUploadProvider(): IUploadProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "cloudinary";
  switch (provider) {
    case "cloudinary":
      return new CloudinaryProvider();
    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}
