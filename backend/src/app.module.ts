import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HealthController } from "./health.controller";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PublicModule } from "./modules/public/public.module";
import { ProgramsModule } from "./modules/programs/programs.module";
import { DonationsModule } from "./modules/donations/donations.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { DistributionsModule } from "./modules/distributions/distributions.module";
import { UsersModule } from "./modules/users/users.module";
import { RbacModule } from "./modules/rbac/rbac.module";
import { LembagaModule } from "./modules/lembaga/lembaga.module";
import { VolunteersModule } from "./modules/volunteers/volunteers.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { CoaModule } from "./modules/coa/coa.module";
import { JournalModule } from "./modules/journal/journal.module";
import { LedgerModule } from "./modules/ledger/ledger.module";

const isDev = process.env.NODE_ENV !== "production";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
        redact: {
          paths: [
            "req.headers.cookie",
            "req.headers.authorization",
            "req.body.password",
            "req.body.confirmPassword",
            "req.body.currentPassword",
            "req.body.newPassword",
          ],
          remove: true,
        },
        transport: isDev
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            }
          : undefined,
      },
    }),
    // Rate limit global /api ~300/menit; override per-route via @Throttle
    ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    // VolunteersModule must be registered before PublicModule: PublicModule
    // imports LembagaModule internally, and LembagaController's GET
    // api/lembaga/:id would otherwise shadow the literal routes
    // api/lembaga/volunteer-activities and api/lembaga/volunteer-applications
    // (registration order across the whole module graph determines Express
    // route-matching precedence, not just this array's position).
    VolunteersModule,
    PublicModule,
    ProgramsModule,
    DonationsModule,
    PaymentsModule,
    DistributionsModule,
    UsersModule,
    RbacModule,
    LembagaModule,
    AnalyticsModule,
    ReportsModule,
    SettingsModule,
    UploadsModule,
    WebhooksModule,
    CoaModule,
    JournalModule,
    LedgerModule,
  ],
  controllers: [HealthController],
  providers: [
    // Urutan APP_GUARD menentukan eksekusi: Throttler → Auth → Permissions
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
