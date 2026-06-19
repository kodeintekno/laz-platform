import { Module } from "@nestjs/common";
import { RbacController } from "./rbac.controller";
import { RbacService } from "./rbac.service";
import { RbacRepository } from "./rbac.repository";

@Module({
  controllers: [RbacController],
  providers: [RbacService, RbacRepository],
  exports: [RbacService],
})
export class RbacModule {}
