import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger as PinoLogger } from "nestjs-pino";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppModule } from "./app.module";
import { getSession } from "./config/session";
import { getCsrf } from "./config/csrf";

/**
 * Path yang dikecualikan dari session & CSRF:
 * - webhook Midtrans dipanggil server-to-server tanpa cookie
 * - health check tidak butuh state
 */
const STATELESS_PATHS = ["/api/webhooks", "/api/health"];

function skipStateless(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (STATELESS_PATHS.some((p) => req.path.startsWith(p))) return next();
    return handler(req, res, next);
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false, // dipasang manual agar limit & urutan terkontrol
  });

  app.useLogger(app.get(PinoLogger));

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);
  expressApp.disable("x-powered-by");

  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Session + CSRF — webhook & health dikecualikan
  const { middleware: sessionMiddleware } = getSession();
  const { doubleCsrfProtection } = getCsrf();
  app.use(skipStateless(sessionMiddleware));
  app.use(skipStateless(doubleCsrfProtection));

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
