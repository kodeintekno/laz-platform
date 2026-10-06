import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Writable } from "node:stream";
import pinoHttp from "pino-http";
import { describe, expect, it } from "vitest";
import { httpLogRedaction } from "../../src/config/logging";

describe("HTTP callback-secret redaction", () => {
  it.each([
    "/api/webhooks/xendit/payment",
    "/api/webhooks/xendit/payout",
    "/api/health",
  ])("removes callback secrets from all request logs on %s", (url) => {
    for (const statusCode of [200, 401, 500]) {
      const token = "callback-secret-must-never-appear";
      let output = "";
      const destination = new Writable({
        write(chunk, _encoding, callback) {
          output += chunk.toString();
          callback();
        },
      });
      // Only HTTP objects are mocked; serialization and redaction use real Pino.
      const req = {
        method: "POST", url,
        headers: {
          "x-callback-token": token,
          authorization: "Bearer private-auth",
          cookie: "laz.sid=private-session",
          "content-type": "application/json",
        },
        socket: { remoteAddress: "127.0.0.1", remotePort: 12345 },
      } as IncomingMessage;
      const res = Object.assign(new EventEmitter(), {
        statusCode, headersSent: true, writableEnded: true, getHeaders: () => ({}),
      }) as ServerResponse;
      pinoHttp({ redact: httpLogRedaction }, destination)(req, res);

      req.log.info({ event: "payment.capture" }, "Received webhook");
      req.log.child({ context: "WebhookService" }).warn("Rejected webhook");
      req.log.error({ err: new Error("Processing failed") }, "Webhook error");
      res.emit("finish");

      expect(output).not.toContain(token);
      expect(output).not.toContain("private-auth");
      expect(output).not.toContain("private-session");
      const records = output.trim().split("\n").map((line) => JSON.parse(line));
      expect(records).toHaveLength(4);
      for (const record of records) {
        expect(record.req.url).toBe(url);
        expect(record.req.headers).toEqual({ "content-type": "application/json" });
      }
      expect(records[0].event).toBe("payment.capture");
      expect(records[3].res.statusCode).toBe(statusCode);
      // Logging must not remove the header that the webhook verifier consumes.
      expect(req.headers["x-callback-token"]).toBe(token);
    }
  });
});
