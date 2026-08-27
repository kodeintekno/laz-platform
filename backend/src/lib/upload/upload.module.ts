import { Module } from "@nestjs/common";
import { CloudinaryProvider } from "./cloudinary.provider";
import { FileProcessingService } from "./file-processing.service";

@Module({
  providers: [CloudinaryProvider, FileProcessingService],
  exports: [CloudinaryProvider, FileProcessingService],
})
export class UploadModule {}
