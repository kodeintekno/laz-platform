/**
 * Format input nominal Rupiah tanpa mengubahnya menjadi nilai desimal.
 * Contoh: "1000000" menjadi "1.000.000".
 */
export function formatIdrAmountInput(value: string | number): string {
  const digits = String(value).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
