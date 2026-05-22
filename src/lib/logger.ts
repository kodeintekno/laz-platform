import pino from "pino";

/**
 * System logger — for application events, errors, and infrastructure logs.
 *
 * IMPORTANT: This is NOT the audit logger.
 * - System logs: operational events (startup, errors, webhook received, etc.)
 * - Audit logs:  business mutations (stored in the `audit_logs` DB table via AuditService)
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info({ userId }, "User signed in")
 *   logger.error({ err }, "Payment webhook processing failed")
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
