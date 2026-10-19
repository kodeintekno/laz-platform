import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DynamicModule, ExecutionContext } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { getOptionsToken, ThrottlerGuard, ThrottlerModule, ThrottlerStorageService } from "@nestjs/throttler";
import { AppModule } from "../../src/app.module";
import { AuthController } from "../../src/modules/auth/auth.controller";
import { VolunteersController } from "../../src/modules/volunteers/volunteers.controller";
import { LembagaController } from "../../src/modules/lembaga/lembaga.controller";
import { SettingsController } from "../../src/modules/settings/settings.controller";
import { DonationsController } from "../../src/modules/donations/donations.controller";
import { DistributionsController } from "../../src/modules/distributions/distributions.controller";
import { WebhooksController } from "../../src/modules/webhooks/webhooks.controller";
import { HealthController } from "../../src/health.controller";

// Inspect production module wiring without loading .env or booting external services.
vi.mock("@nestjs/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@nestjs/config")>();
  class ConfigModule {
    static forRoot() { return { module: ConfigModule }; }
  }
  return { ...actual, ConfigModule };
});

const imports: DynamicModule[] = Reflect.getMetadata("imports", AppModule);
const throttleModule = imports.find((entry) => entry.module === ThrottlerModule)!;
const options = (throttleModule.providers!.find((provider: any) => provider.provide === getOptionsToken()) as any).useValue;

function context(controller: any, method: string, ip = "192.0.2.1") {
  const header = vi.fn();
  return {
    header,
    execution: {
      getClass: () => controller,
      getHandler: () => controller.prototype[method],
      switchToHttp: () => ({
        getRequest: () => ({ ip, headers: {}, body: { email: "attacker@example.test", password: "wrong-password" } }),
        getResponse: () => ({ header }),
      }),
    } as unknown as ExecutionContext,
  };
}

describe("production throttler registration and route policies", () => {
  let guard: ThrottlerGuard;
  let storage: ThrottlerStorageService;

  beforeEach(async () => {
    vi.useFakeTimers();
    storage = new ThrottlerStorageService();
    guard = new ThrottlerGuard(structuredClone(options), storage, new Reflector());
    await guard.onModuleInit();
  });

  afterEach(() => {
    storage.onApplicationShutdown();
    vi.useRealTimers();
  });

  it("registers the real throttler as the first global guard", () => {
    const providers = Reflect.getMetadata("providers", AppModule);
    expect(providers.filter((provider: any) => provider.provide === APP_GUARD)[0].useClass).toBe(ThrottlerGuard);
  });

  it.each([
    [AuthController, "login", 5, 900],
    [VolunteersController, "login", 5, 900],
    [VolunteersController, "register", 5, 900],
    [LembagaController, "register", 5, 900],
    [SettingsController, "changePassword", 5, 900],
    [DonationsController, "createPublic", 10, 60],
    [DonationsController, "publicStatus", 60, 60],
    [DonationsController, "history", 20, 60],
    [DistributionsController, "history", 20, 60],
  ].map(([controller, method, limit, seconds]: any) => ({ controller, method, limit, seconds, label: `${controller.name}.${method}` })))("enforces $label at $limit requests with a $seconds second block", async ({ controller, method, limit, seconds }) => {
    const ctx = context(controller, method);
    for (let attempt = 0; attempt < limit; attempt++) {
      await expect(guard.canActivate(ctx.execution)).resolves.toBe(true);
    }
    await expect(guard.canActivate(ctx.execution)).rejects.toMatchObject({ status: 429 });
    expect(ctx.header).toHaveBeenCalledWith("Retry-After", seconds);
  });

  it.each([AuthController, VolunteersController].map((controller) => ({ controller, label: controller.name })))("keeps $label login blocked beyond one minute, isolates IPs, and allows recovery", async ({ controller }) => {
    const ctx = context(controller, "login");
    for (let attempt = 0; attempt < 5; attempt++) await guard.canActivate(ctx.execution);
    await expect(guard.canActivate(ctx.execution)).rejects.toMatchObject({ status: 429 });
    await vi.advanceTimersByTimeAsync(60_001);
    await expect(guard.canActivate(ctx.execution)).rejects.toMatchObject({ status: 429 });
    await expect(guard.canActivate(context(controller, "login", "192.0.2.2").execution)).resolves.toBe(true);
    await vi.advanceTimersByTimeAsync(840_000);
    await expect(guard.canActivate(ctx.execution)).resolves.toBe(true);
  });

  it("retains the 300/minute fallback for routes without an override", async () => {
    const ctx = context(AuthController, "me");
    for (let attempt = 0; attempt < 300; attempt++) await guard.canActivate(ctx.execution);
    await expect(guard.canActivate(ctx.execution)).rejects.toMatchObject({ status: 429 });
    await vi.advanceTimersByTimeAsync(60_001);
    await expect(guard.canActivate(ctx.execution)).resolves.toBe(true);
  });

  it.each([
    [WebhooksController, "xenditPayment"], [WebhooksController, "xenditPayout"],
    [AuthController, "csrf"], [HealthController, "health"],
  ].map(([controller, method]: any) => ({ controller, method, label: `${controller.name}.${method}` })))("honors the existing exemption for $label", async ({ controller, method }) => {
    const increment = vi.spyOn(storage, "increment");
    const ctx = context(controller, method);
    for (let attempt = 0; attempt < 301; attempt++) await expect(guard.canActivate(ctx.execution)).resolves.toBe(true);
    expect(increment).not.toHaveBeenCalled();
  });
});
