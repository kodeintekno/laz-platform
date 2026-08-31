import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { FileProcessingService } from "../../src/lib/upload/file-processing.service";

function pdfFile(size: number): Express.Multer.File {
  const buffer = Buffer.alloc(size);
  buffer.write("%PDF-1.7", 0, "ascii");

  return {
    buffer,
    size,
    mimetype: "application/pdf",
    originalname: "document.pdf",
    fieldname: "file",
    encoding: "7bit",
    destination: "",
    filename: "document.pdf",
    path: "",
    stream: undefined as never,
  };
}

describe("FileProcessingService upload limits", () => {
  const service = new FileProcessingService();

  it("accepts a valid 6 MB PDF", async () => {
    const file = pdfFile(6 * 1024 * 1024);

    const result = await service.process(file);

    expect(result.originalSize).toBe(file.size);
    expect(result.processedSize).toBe(file.size);
    expect(result.mimetype).toBe("application/pdf");
  });

  it("accepts a valid PDF at the exact 10 MB boundary", async () => {
    const file = pdfFile(10 * 1024 * 1024);

    await expect(service.process(file)).resolves.toMatchObject({
      originalSize: file.size,
      mimetype: "application/pdf",
    });
  });

  it("rejects a PDF above 10 MB", async () => {
    const file = pdfFile(10 * 1024 * 1024 + 1);

    await expect(service.process(file)).rejects.toBeInstanceOf(BadRequestException);
  });
});
