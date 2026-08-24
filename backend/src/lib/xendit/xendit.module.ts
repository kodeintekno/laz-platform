import { Global, Module } from "@nestjs/common";
import { XenditService } from "./xendit.service";

/**
 * Global module — XenditService injected wherever needed
 * without re-importing XenditModule in each feature module.
 */
@Global()
@Module({
  providers: [XenditService],
  exports: [XenditService],
})
export class XenditModule {}
