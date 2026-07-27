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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — images & PDF documents

/**
 * Upload Cloudinary — pengganti src/app/api/upload/route.ts.
 * Auth-only (guard global) + CSRF (mutasi). Multer memory storage,
 * 10MB, gambar atau PDF (dokumen legalitas/KTP/CV).
 */
@Controller("api/upload")
export class UploadsController {
  constructor(private readonly cloudinaryProvider: CloudinaryProvider) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
          return cb(new BadRequestException("Hanya file gambar atau PDF yang diizinkan"), false);
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
    const result = await this.cloudinaryProvider.upload(
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
    await this.cloudinaryProvider.delete(publicId);
    return { deleted: true };
  }
}
