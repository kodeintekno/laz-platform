export const BANK_OPTIONS = [
  { value: "ID_BCA", label: "BCA – Bank Central Asia" },
  { value: "ID_MANDIRI", label: "MANDIRI – Bank Mandiri" },
  { value: "ID_BNI", label: "BNI – Bank Negara Indonesia" },
  { value: "ID_BRI", label: "BRI – Bank Rakyat Indonesia" },
  { value: "ID_BSI", label: "BSI – Bank Syariah Indonesia" },
  { value: "ID_CIMB", label: "CIMB – CIMB Niaga" },
  { value: "ID_PERMATA", label: "PERMATA – Bank Permata" },
  { value: "ID_DANAMON", label: "DANAMON – Bank Danamon" },
  { value: "ID_MUAMALAT", label: "MUAMALAT – Bank Muamalat" },
] as const;

export function getBankLabel(bankCode: string): string {
  return BANK_OPTIONS.find((bank) => bank.value === bankCode)?.label
    ?? bankCode.replace(/^ID_/, "");
}
