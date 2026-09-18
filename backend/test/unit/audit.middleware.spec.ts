import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { auditRequestMiddleware } from "../../src/modules/audit/audit.middleware";
import { contextData } from "../../src/modules/audit/audit-context";

describe("Audit request context", () => {
  it("keeps concurrent failure contexts separate and excludes credentials", async () => {
    const captured: unknown[] = [];
    const log = vi.fn(async (input) => { captured.push({ input, context: contextData() }); });
    const middleware = auditRequestMiddleware({ log });
    const responses = [0, 1].map((index) => {
      const response = Object.assign(new EventEmitter(), { statusCode: 401, locals: { auditError: "INVALID_CREDENTIALS" }, setHeader: vi.fn() });
      const request = { path: "/api/auth/login", method: "POST", ip: `127.0.0.${index}`, get: () => "test-device", body: { email: `test${index}@example.test`, password: "must-not-appear", token: "must-not-appear" }, params: {} };
      middleware(request as any, response as any, vi.fn());
      return response;
    });
    responses[1].emit("finish");
    responses[0].emit("finish");
    const [second, first] = captured as any[];
    expect(second.context.ipAddress).toBe("127.0.0.1");
    expect(first.context.ipAddress).toBe("127.0.0.0");
    expect(first.context.requestId).not.toBe(second.context.requestId);
    expect(first.context.requestId).toBe(responses[0].setHeader.mock.calls[0][1]);
    expect(first.input).toMatchObject({ action: "LOGIN_FAILED", status: "FAILED", errorMessage: "INVALID_CREDENTIALS" });
    expect(JSON.stringify(captured)).not.toContain("must-not-appear");
  });
});
