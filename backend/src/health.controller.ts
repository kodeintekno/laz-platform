import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "./common/decorators/public.decorator";

@Controller("api/health")
export class HealthController {
  @Get()
  @Public()
  @SkipThrottle()
  health() {
    return { status: "ok", uptime: process.uptime() };
  }
}
