import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Request } from "express";

export const auditContext = new AsyncLocalStorage<{ request: Request; requestId: string }>();
export function contextData() {
  const context = auditContext.getStore();
  const req = context?.request;
  return {
    requestId: context?.requestId ?? randomUUID(),
    userId: req?.session?.userId ?? null,
    actor: req?.path.startsWith("/api/webhooks") ? "WEBHOOK" : req ? "USER" : "SYSTEM",
    ipAddress: req?.ip,
    userAgent: req?.get("user-agent")?.slice(0, 1000),
    httpMethod: req?.method,
    endpoint: req?.path,
  };
}

/** Transaction-local settings never leak into another pooled request. */
export function withAuditContext(client: any): any {
  const mutations = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany"]);
  const delegates = new Map<PropertyKey, unknown>();
  const configure = (tx: any, context: unknown) => tx.$executeRaw`SELECT set_config('app.audit_context', ${JSON.stringify(context)}, true)`;
  return new Proxy(client, {
    get(target, key) {
      if (key === "$transaction") return (work: any, options: any) => {
        const context = contextData();
        if (typeof work !== "function") return target.$transaction([target.$executeRaw`SELECT set_config('app.audit_context', ${JSON.stringify(context)}, true)`, ...work], options).then((rows: any[]) => rows.slice(1));
        return target.$transaction(async (tx: any) => { await configure(tx, context); return work(tx); }, options);
      };
      const value = Reflect.get(target, key, target);
      if (value && typeof value === "object" && typeof value.findMany === "function") {
        if (!delegates.has(key)) delegates.set(key, new Proxy(value, {
          get(delegate, operation) {
            if (mutations.has(String(operation))) return (args: any) => {
              // Preserve Prisma's lazy promise and batch-transaction protocol.
              // Eagerly returning a normal Promise would execute batch writes
              // before $transaction([...]) can own/roll them back.
              const pending = delegate[operation](args);
              const context = contextData();
              let standalone: Promise<unknown> | undefined;
              return new Proxy(pending, {
                get(promise, property) {
                  if (["then", "catch", "finally"].includes(String(property))) return (...handlers: any[]) => {
                    standalone ??= target.$transaction(async (tx: any) => {
                      await configure(tx, context);
                      return tx[key][operation](args);
                    });
                    return (standalone as any)[property](...handlers);
                  };
                  const member = Reflect.get(promise, property, promise);
                  return typeof member === "function" ? member.bind(promise) : member;
                },
              });
            };
            const method = delegate[operation];
            return typeof method === "function" ? method.bind(delegate) : method;
          },
        }));
        return delegates.get(key);
      }
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
