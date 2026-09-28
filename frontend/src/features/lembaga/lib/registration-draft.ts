import type { LembagaRegistrationInput } from "../validations/lembaga.schema";

export const DRAFT_KEY = "laz_lembaga_reg_draft";
export const STEP_KEY = "laz_lembaga_reg_step";
type SafeDraft = Partial<Omit<LembagaRegistrationInput, "adminPassword" | "confirmPassword">>;

// Opt in only non-secret fields, including incomplete values while typing.
const STRING_FIELDS = [
  "name", "picName", "picPhone", "address", "description", "website",
  "izinYayasanNumber", "logoUrl", "logoPublicId", "officePhotoUrl", "officePhotoPublicId",
  "aktaYayasanUrl", "aktaYayasanPublicId", "skKemenkumhamUrl", "skKemenkumhamPublicId",
  "npwpUrl", "npwpPublicId", "otherDocumentUrl", "otherDocumentPublicId", "adminName", "adminEmail",
] as const satisfies readonly (keyof SafeDraft)[];

function sanitizeDraft(value: unknown): SafeDraft {
  const safe: SafeDraft = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return safe;
  const input = value as Record<string, unknown>;
  for (const key of STRING_FIELDS) {
    if (Object.hasOwn(input, key) && typeof input[key] === "string") safe[key] = input[key];
  }
  if (typeof input.termsAccepted === "boolean") safe.termsAccepted = input.termsAccepted;
  return safe;
}

function discardDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* Storage may be disabled. */ }
}

export function loadDraft(): SafeDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const safe = sanitizeDraft(JSON.parse(raw));
    const serialized = JSON.stringify(safe);
    if (serialized !== raw) {
      // Remove legacy secrets before rewriting, even if a quota error prevents saving.
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem(DRAFT_KEY, serialized);
    }
    return safe;
  } catch {
    discardDraft();
    return {};
  }
}

export function saveDraft(data: Partial<LembagaRegistrationInput>) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(sanitizeDraft(data))); }
  catch { discardDraft(); }
}

export function loadStep(): number {
  try {
    const step = Number.parseInt(localStorage.getItem(STEP_KEY) ?? "0", 10);
    // Passwords must be re-entered before the final terms step on every reload.
    return Number.isFinite(step) ? Math.max(0, Math.min(2, step)) : 0;
  } catch { return 0; }
}
