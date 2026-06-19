import { describe, it, expect } from "vitest";
import { of, lastValueFrom } from "rxjs";
import type { ExecutionContext, CallHandler } from "@nestjs/common";
import { TransformInterceptor } from "../../src/common/interceptors/transform.interceptor";

function callHandler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

const mockContext = {} as ExecutionContext;

describe("TransformInterceptor", () => {
  const interceptor = new TransformInterceptor();

  it("wraps a plain value in { success: true, data }", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler({ id: 1, name: "test" })),
    );

    expect(result).toEqual({ success: true, data: { id: 1, name: "test" } });
  });

  it("wraps null value in { success: true, data: null }", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler(null)),
    );

    expect(result).toEqual({ success: true, data: null });
  });

  it("wraps undefined value in { success: true, data: null }", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler(undefined)),
    );

    expect(result).toEqual({ success: true, data: null });
  });

  it("promotes { data, meta } envelope to { success: true, data, meta }", async () => {
    const payload = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { currentPage: 1, totalPages: 5, totalCount: 50, pageSize: 10 },
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler(payload)),
    );

    expect(result).toEqual({ success: true, ...payload });
  });

  it("does NOT promote object with data+meta plus extra keys (passes through as data)", async () => {
    const payload = { data: [1, 2], meta: { page: 1 }, extra: "field" };

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler(payload)),
    );

    // Object has 3 keys → treated as a normal value, wrapped as data
    expect(result).toEqual({ success: true, data: payload });
  });

  it("wraps a primitive string in { success: true, data }", async () => {
    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler("hello")),
    );

    expect(result).toEqual({ success: true, data: "hello" });
  });

  it("wraps an array in { success: true, data }", async () => {
    const items = [1, 2, 3];

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler(items)),
    );

    expect(result).toEqual({ success: true, data: items });
  });
});
