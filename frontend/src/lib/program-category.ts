export const PROGRAM_CATEGORY_LABELS: Record<string, string> = {
  ZAKAT: "Zakat",
  INFAK_SEDEKAH: "Infak/Sedekah",
  WAKAF: "Wakaf",
  CSR: "CSR",
  DSKL: "DSKL",
};

export function formatProgramCategory(category: string): string {
  return PROGRAM_CATEGORY_LABELS[category] ?? category;
}
