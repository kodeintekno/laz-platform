import { describe, expect, it } from "vitest";
import { resolveLembagaScope } from "../../src/common/utils/lembaga-scope";
import type { RBACSessionUser } from "../../../shared/types/rbac";

function session(overrides: Partial<RBACSessionUser>): RBACSessionUser {
  return {
    id: "user-1",
    email: "user@example.com",
    permissions: [],
    ...overrides,
  };
}

describe("resolveLembagaScope", () => {
  it("allows FINANCE_PLATFORM with platform finance permission to select any Lembaga", () => {
    const user = session({
      roleName: "FINANCE_PLATFORM",
      lembagaId: null,
      permissions: ["platform_finance.read"],
    });

    expect(resolveLembagaScope(user, "lembaga-2")).toBe("lembaga-2");
    expect(resolveLembagaScope(user)).toBeUndefined();
  });

  it("keeps LEMBAGA_ADMIN locked to its session Lembaga", () => {
    const user = session({
      roleName: "LEMBAGA_ADMIN",
      lembagaId: "lembaga-1",
      permissions: ["reports.financial"],
    });

    expect(resolveLembagaScope(user, "lembaga-2")).toBe("lembaga-1");
  });

  it("keeps SUPER_ADMIN platform-wide through its built-in permission override", () => {
    const user = session({ roleName: "SUPER_ADMIN", lembagaId: null });

    expect(resolveLembagaScope(user, "lembaga-3")).toBe("lembaga-3");
  });
});
