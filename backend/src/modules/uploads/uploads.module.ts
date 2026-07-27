import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { UploadModule } from "../../lib/upload/upload.module";

@Module({
  imports: [UploadModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
