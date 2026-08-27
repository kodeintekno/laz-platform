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
import { Public } from "../../common/decorators/public.decorator";
import { CloudinaryProvider } from "../../lib/upload/cloudinary.provider";
import { FileProcessingService } from "../../lib/upload/file-processing.service";

/** Hard limit — FileProcessingService will also validate, but Multer stops huge uploads early */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Upload Cloudinary — pengganti src/app/api/upload/route.ts.
 * POST bersifat @Public() agar form registrasi (Lembaga/Relawan) dapat
 * mengupload file sebelum login. Throttler global tetap aktif sebagai
 * proteksi rate-limit. DELETE tetap memerlukan autentikasi.
 *
 * Pipeline:
 *  1. Multer: memory storage, hard 10 MB limit, whitelist MIME filter
 *  2. FileProcessingService: magic-bytes validation + image→WebP compression
 *  3. CloudinaryProvider: upload buffer hasil processing
 */
@Controller("api/upload")
export class UploadsController {
  constructor(
    private readonly cloudinaryProvider: CloudinaryProvider,
    private readonly fileProcessingService: FileProcessingService,
  ) {}

  @Public()
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        // Strict whitelist — hanya PNG, JPG/JPEG, dan PDF
        const allowed = ["image/png", "image/jpeg", "application/pdf"];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Format file tidak diizinkan: ${file.mimetype}. Hanya PNG, JPG/JPEG, dan PDF yang diterima.`,
            ),
            false,
          );
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

    // Process: validate magic bytes + compress images to WebP
    const processed = await this.fileProcessingService.process(file);

    // Upload processed buffer to Cloudinary
    const result = await this.cloudinaryProvider.upload(
      { buffer: processed.buffer, mimetype: processed.mimetype },
      { folder: folder || undefined },
    );

    return {
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      originalSize: processed.originalSize,
      processedSize: processed.processedSize,
    };
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

