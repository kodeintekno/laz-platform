import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";
import type { UploadFile } from "./provider";

/** Allowed MIME types (whitelist — stricter than image/*) */
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "application/pdf"]);

/** 10 MB hard limit — reject before processing */
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** Target output size for images */
const TARGET_IMAGE_BYTES = 2 * 1024 * 1024;

/** Maximum dimension (longest side) in pixels before resizing */
const MAX_DIMENSION_PX = 2560;

/** Starting WebP quality */
const QUALITY_START = 80;

/** Minimum allowed quality — below this we stop degrading and keep as-is */
const QUALITY_MIN = 50;

/** Quality step per adaptive iteration */
const QUALITY_STEP = 5;

/**
 * Magic-byte signatures used for content-based MIME validation.
 * Checked against the first bytes of the buffer so a renamed file cannot
 * bypass the whitelist by spoofing the Content-Type header.
 */
const MAGIC_SIGNATURES: Array<{ mime: string; offset: number; bytes: number[] }> = [
  { mime: "image/png",    offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }, // ‰PNG
  { mime: "image/jpeg",   offset: 0, bytes: [0xff, 0xd8, 0xff] },        // JPEG SOI
  { mime: "application/pdf", offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

export interface ProcessedFile {
  buffer: Buffer;
  mimetype: string;
  /** Original size in bytes (before processing) */
  originalSize: number;
  /** Size after processing */
  processedSize: number;
}

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  /**
   * Validate and process an uploaded file buffer.
   *
   * - PNG / JPG: convert to WebP, resize if needed, adaptive quality compression.
   * - PDF: content validated via magic bytes, passed through without modification.
   *
   * Throws `BadRequestException` on validation failure so NestJS maps it to HTTP 400.
   */
  async process(file: Express.Multer.File): Promise<ProcessedFile> {
    const originalSize = file.buffer.length;

    // 1. Size gate — reject before any heavy processing
    if (originalSize > MAX_INPUT_BYTES) {
      throw new BadRequestException(
        `Ukuran file terlalu besar (${(originalSize / 1024 / 1024).toFixed(1)} MB). Maksimum 10 MB per file.`,
      );
    }

    // 2. MIME whitelist check
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        `Format file tidak diizinkan: ${file.mimetype}. Hanya PNG, JPG/JPEG, dan PDF yang diterima.`,
      );
    }

    // 3. Content-based validation (magic bytes)
    const detectedMime = this.detectMimeFromBuffer(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        "File tidak dapat diidentifikasi. Pastikan file adalah PNG, JPG/JPEG, atau PDF yang valid.",
      );
    }

    // Reject if declared MIME doesn't match detected content
    // (e.g. .exe renamed to .png with Content-Type: image/png)
    const mimeFamily = (m: string) => (m.startsWith("image/") ? "image" : m);
    if (mimeFamily(detectedMime) !== mimeFamily(file.mimetype)) {
      throw new BadRequestException(
        "Konten file tidak sesuai dengan tipe yang dideklarasikan. Upload ditolak.",
      );
    }

    // 4. Route to appropriate processor
    if (detectedMime === "application/pdf") {
      return {
        buffer: file.buffer,
        mimetype: "application/pdf",
        originalSize,
        processedSize: originalSize,
      };
    }

    // PNG or JPEG → convert to WebP
    return this.processImage(file.buffer, originalSize);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private detectMimeFromBuffer(buffer: Buffer): string | null {
    for (const sig of MAGIC_SIGNATURES) {
      if (buffer.length < sig.offset + sig.bytes.length) continue;
      const match = sig.bytes.every((b, i) => buffer[sig.offset + i] === b);
      if (match) return sig.mime;
    }
    return null;
  }

  /**
   * Convert image to WebP with adaptive quality compression.
   *
   * Algorithm:
   *  1. Resize: if longest side > MAX_DIMENSION_PX, scale down proportionally.
   *  2. Start at QUALITY_START (80). Encode to WebP.
   *  3. If result > TARGET_IMAGE_BYTES and quality > QUALITY_MIN, reduce quality
   *     by QUALITY_STEP and retry (max ~6 iterations: 80→75→70→65→60→55→50).
   *  4. Return whichever version is smaller (compressed vs. original buffer).
   */
  private async processImage(buffer: Buffer, originalSize: number): Promise<ProcessedFile> {
    let pipeline = sharp(buffer).rotate(); // auto-orient via EXIF

    // Resize only if needed
    pipeline = pipeline.resize(MAX_DIMENSION_PX, MAX_DIMENSION_PX, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Adaptive quality loop
    let quality = QUALITY_START;
    let webpBuffer: Buffer | null = null;

    while (quality >= QUALITY_MIN) {
      const candidate = await pipeline
        .clone()
        .webp({ quality, effort: 4 })
        .toBuffer();

      if (candidate.length <= TARGET_IMAGE_BYTES || quality === QUALITY_MIN) {
        webpBuffer = candidate;
        break;
      }

      this.logger.debug(
        `Image at quality=${quality} is ${(candidate.length / 1024).toFixed(0)} KB — reducing quality`,
      );
      quality -= QUALITY_STEP;
    }

    // Fallback safety — should never be null after the loop but keeps TS happy
    if (!webpBuffer) {
      webpBuffer = await pipeline.clone().webp({ quality: QUALITY_MIN, effort: 4 }).toBuffer();
    }

    // Use whichever is smaller: the processed WebP or the original
    // (e.g. a tiny 50KB PNG should not become a larger WebP)
    const useWebp = webpBuffer.length < originalSize;
    const finalBuffer = useWebp ? webpBuffer : buffer;
    const finalMime = useWebp ? "image/webp" : "image/jpeg"; // original is always PNG or JPEG

    this.logger.log(
      `Image processed: ${(originalSize / 1024).toFixed(0)} KB → ${(finalBuffer.length / 1024).toFixed(0)} KB` +
        ` (quality=${quality}, format=${finalMime})`,
    );

    return {
      buffer: finalBuffer,
      mimetype: finalMime,
      originalSize,
      processedSize: finalBuffer.length,
    };
  }
}
