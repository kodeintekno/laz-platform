import { randomUUID } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { auditContext } from "./audit-context";
import type { AuditService } from "./audit.service";

/** Capture rejected requests too (guards, CSRF and validation precede handlers). */
export function auditRequestMiddleware(audit: Pick<AuditService, "log">): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    const context = { request: req, requestId };
    res.setHeader("X-Request-ID", requestId);
    (req as Request & { id?: string }).id = requestId;
    res.on("finish", () => {
      if (res.statusCode < 400 || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
      // EventEmitter callbacks need an explicit context even if emitted outside
      // the original async chain (e.g. middleware rejects a request early).
      void auditContext.run(context, () => audit.log({
        userId: req.session?.userId ?? null,
        action: req.path === "/api/auth/login" ? "LOGIN_FAILED" : "REQUEST_FAILED",
        entity: req.path.split("/")[2] || "Request",
        status: "FAILED",
        errorMessage: res.locals.auditError || `HTTP ${res.statusCode}`,
        entityId: typeof req.params?.id === "string" ? req.params.id : undefined,
        newData: req.path === "/api/auth/login" ? { email: req.body?.email } : undefined,
        transactionData: typeof req.body?.amount === "number" && Number.isFinite(req.body.amount)
          ? { requestedAmount: req.body.amount } : undefined,
      }));
    });
    auditContext.run(context, next);
  };
}
