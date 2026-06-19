import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — mengikuti bodySizeLimit lama

/**
 * Upload Cloudinary — pengganti src/app/api/upload/route.ts.
 * Auth-only (guard global) + CSRF (mutasi). Multer memory storage,
 * 5MB, image-only.
 */
@Controller("api/upload")
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(new BadRequestException("Hanya file gambar yang diizinkan"), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("folder") folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    const provider = new CloudinaryProvider();
    const result = await provider.upload(
      { buffer: file.buffer, mimetype: file.mimetype },
      { folder: folder || undefined },
    );
    return { url: result.url, publicId: result.publicId };
  }

  @Delete()
  async remove(@Query("publicId") publicId?: string) {
    if (!publicId) {
      throw new BadRequestException("publicId query param required");
    }
    const provider = new CloudinaryProvider();
    await provider.delete(publicId);
    return { deleted: true };
  }
}
