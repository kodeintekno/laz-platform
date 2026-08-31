export type ParsedAmilPercentage = { value: number; error: string | null };

export function parseAmilPercentage(rawValue: string | number, label: string): ParsedAmilPercentage {
  const raw = String(rawValue).trim();
  if (!raw) return { value: 0, error: `${label} wajib diisi` };

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { value: 0, error: `${label} harus berada di antara 0% dan 100%` };
  }
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
    return { value: 0, error: `${label} maksimal menggunakan 2 angka desimal` };
  }
  return { value, error: null };
}
