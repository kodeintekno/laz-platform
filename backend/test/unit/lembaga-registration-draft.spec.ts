import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_KEY, STEP_KEY, loadDraft, loadStep, saveDraft } from "../../../frontend/src/features/lembaga/lib/registration-draft";

describe("Lembaga registration draft credential privacy", () => {
  let entries: Map<string, string>;
  let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    entries = new Map();
    storage = {
      getItem: vi.fn((key: string) => entries.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { entries.set(key, value); }),
      removeItem: vi.fn((key: string) => { entries.delete(key); }),
    };
    vi.stubGlobal("localStorage", storage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps autosaved credentials out of storage and restored values without changing live submission data", () => {
    const live = { name: "Unfinished profile", adminEmail: "admin@example.test", adminPassword: "secret-admin-123", confirmPassword: "secret-confirm-456", termsAccepted: false };
    const original = { ...live };
    for (const name of ["U", "Updated profile"]) {
      saveDraft({ ...live, name });
      const raw = entries.get(DRAFT_KEY)!;
      expect(raw).not.toMatch(/Password|secret-admin|secret-confirm/);
      // A failed/abandoned submission does not clear storage; a later reload is still safe.
      expect(loadDraft()).toEqual({ name, adminEmail: live.adminEmail, termsAccepted: false });
    }
    expect(live).toEqual(original);
  });

  it("scrubs legacy credentials immediately on load while preserving profile, uploads and progress", () => {
    entries.set(DRAFT_KEY, JSON.stringify({ name: "Saved", adminName: "Admin", adminPassword: "legacy-secret", confirmPassword: "legacy-confirm", logoUrl: "https://example.test/logo", termsAccepted: true }));
    entries.set(`${DRAFT_KEY}_uploads`, "upload-control");
    entries.set(STEP_KEY, "1");
    const safe = { name: "Saved", adminName: "Admin", logoUrl: "https://example.test/logo", termsAccepted: true };
    expect(loadDraft()).toEqual(safe);
    expect(JSON.parse(entries.get(DRAFT_KEY)!)).toEqual(safe);
    expect(loadDraft()).toEqual(safe);
    expect(entries.get(`${DRAFT_KEY}_uploads`)).toBe("upload-control");
    expect(loadStep()).toBe(1);
  });

  it("rejects unknown fields and nested secret-bearing values", () => {
    entries.set(DRAFT_KEY, '{"name":{"adminPassword":"nested-secret"},"password":"alias-secret","futureSecret":"secret","termsAccepted":"true","adminEmail":"safe@example.test"}');
    expect(loadDraft()).toEqual({ adminEmail: "safe@example.test" });
    expect(entries.get(DRAFT_KEY)).toBe('{"adminEmail":"safe@example.test"}');
    saveDraft({ adminName: "Safe", extra: { password: "nested-secret" } } as any);
    expect(entries.get(DRAFT_KEY)).toBe('{"adminName":"Safe"}');
  });

  it.each(["null", "[]", '"secret"', '{"adminPassword":"broken'])("handles invalid legacy data %s without restoring credentials", (raw) => {
    entries.set(DRAFT_KEY, raw);
    expect(loadDraft()).toEqual({});
    expect(entries.get(DRAFT_KEY) ?? "").not.toMatch(/secret|Password/);
  });

  it("removes legacy credentials even when rewriting exceeds storage quota", () => {
    entries.set(DRAFT_KEY, '{"name":"Saved","adminPassword":"legacy-secret"}');
    storage.setItem.mockImplementation(() => { throw new Error("quota"); });
    expect(loadDraft()).toEqual({});
    expect(entries.has(DRAFT_KEY)).toBe(false);
  });

  it("removes stale drafts when autosaving fails", () => {
    entries.set(DRAFT_KEY, '{"adminPassword":"legacy-secret"}');
    storage.setItem.mockImplementation(() => { throw new Error("quota"); });
    expect(() => saveDraft({ adminPassword: "new-secret" })).not.toThrow();
    expect(entries.has(DRAFT_KEY)).toBe(false);
  });

  it("allows in-memory registration when browser storage is disabled", () => {
    for (const fn of Object.values(storage)) fn.mockImplementation(() => { throw new Error("disabled"); });
    expect(loadDraft()).toEqual({});
    expect(loadStep()).toBe(0);
    expect(() => saveDraft({ adminPassword: "memory-only" })).not.toThrow();
  });

  it.each([["0", 0], ["1", 1], ["2", 2], ["3", 2], ["999", 2], ["bad", 0]])("resumes step %s at %s so passwords can be re-entered", (stored, expected) => {
    entries.set(STEP_KEY, stored as string);
    expect(loadStep()).toBe(expected);
  });
});
