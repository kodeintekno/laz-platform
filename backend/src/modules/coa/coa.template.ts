/**
 * COA Template Standar — Ruang Berbagi Platform
 *
 * Sumber kebenaran tunggal untuk semua akun COA sistem.
 * Digunakan oleh:
 *  - CoaRepository.seedCoaForLembaga() (runtime: saat lembaga di-approve)
 *  - seed.ts (dev: seeding sample lembaga)
 *
 * Level:
 *   1 = root (1000, 2000, …)
 *   2 = group header (1100, 1200, …)
 *   3 = detail account (1101, 1102, …)
 */

export type AccountType = "ASSET" | "LIABILITY" | "FUND" | "REVENUE" | "EXPENSE";
export type NormalBalance = "DEBIT" | "CREDIT";

export interface CoaTemplateRow {
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  isHeader: boolean;
  parentCode: string | null;
  level: number;
}

export const COA_TEMPLATE: CoaTemplateRow[] = [
  // ─── 1000 ASSET ───────────────────────────────────────────────────────────────
  { code: "1000", name: "Aset", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "1100", name: "Kas dan Bank", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1101", name: "Kas", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1102", name: "Kas Kecil", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1103", name: "Bank", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1100", level: 3 },
  { code: "1110", name: "Piutang", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1111", name: "Piutang Lain-lain", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1110", level: 3 },
  { code: "1120", name: "Persediaan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1121", name: "Persediaan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1120", level: 3 },
  { code: "1200", name: "Aset Tetap", accountType: "ASSET", normalBalance: "DEBIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1201", name: "Peralatan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1202", name: "Kendaraan", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1203", name: "Gedung", accountType: "ASSET", normalBalance: "DEBIT", isHeader: false, parentCode: "1200", level: 3 },
  { code: "1290", name: "Akumulasi Penyusutan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: true, parentCode: "1000", level: 2 },
  { code: "1291", name: "Akumulasi Penyusutan Peralatan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },
  { code: "1292", name: "Akumulasi Penyusutan Kendaraan", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },
  { code: "1293", name: "Akumulasi Penyusutan Gedung", accountType: "ASSET", normalBalance: "CREDIT", isHeader: false, parentCode: "1290", level: 3 },

  // ─── 2000 LIABILITY ───────────────────────────────────────────────────────────
  { code: "2000", name: "Kewajiban", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "2100", name: "Utang", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: true, parentCode: "2000", level: 2 },
  { code: "2101", name: "Utang Operasional", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2102", name: "Utang Gaji", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2103", name: "Utang Pajak", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },
  { code: "2104", name: "Utang Lain-lain", accountType: "LIABILITY", normalBalance: "CREDIT", isHeader: false, parentCode: "2100", level: 3 },

  // ─── 3000 FUND ────────────────────────────────────────────────────────────────
  { code: "3000", name: "Dana", accountType: "FUND", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "3100", name: "Dana", accountType: "FUND", normalBalance: "CREDIT", isHeader: true, parentCode: "3000", level: 2 },
  { code: "3101", name: "Dana Zakat", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3102", name: "Dana Infak", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3103", name: "Dana Sedekah", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3104", name: "Dana Wakaf", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3105", name: "Dana Amil", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },
  { code: "3106", name: "Dana Nonhalal", accountType: "FUND", normalBalance: "CREDIT", isHeader: false, parentCode: "3100", level: 3 },

  // ─── 4000 PENERIMAAN DANA ─────────────────────────────────────────────────────
  { code: "4000", name: "Penerimaan Dana", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: true, parentCode: null, level: 1 },
  { code: "4100", name: "Penerimaan", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: true, parentCode: "4000", level: 2 },
  { code: "4101", name: "Penerimaan Zakat", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4102", name: "Penerimaan Infak", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4103", name: "Penerimaan Sedekah", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4104", name: "Penerimaan Wakaf", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4105", name: "Penerimaan Dana Amil", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4106", name: "Penerimaan Hibah", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },
  { code: "4107", name: "Pendapatan Lainnya", accountType: "REVENUE", normalBalance: "CREDIT", isHeader: false, parentCode: "4100", level: 3 },

  // ─── 5000 PENYALURAN DANA ─────────────────────────────────────────────────────
  { code: "5000", name: "Penyaluran Dana", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "5100", name: "Penyaluran", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: "5000", level: 2 },
  { code: "5101", name: "Penyaluran Zakat", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5102", name: "Penyaluran Infak", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5103", name: "Penyaluran Sedekah", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },
  { code: "5104", name: "Penyaluran Wakaf", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "5100", level: 3 },

  // ─── 6000 BEBAN OPERASIONAL ───────────────────────────────────────────────────
  { code: "6000", name: "Beban Operasional", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: null, level: 1 },
  { code: "6100", name: "Beban Operasional", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: true, parentCode: "6000", level: 2 },
  { code: "6101", name: "Beban Gaji", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6102", name: "Beban Listrik", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6103", name: "Beban Air", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6104", name: "Beban Internet", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6105", name: "Beban ATK", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6106", name: "Beban Transportasi", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6107", name: "Beban Administrasi Bank", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6108", name: "Beban Konsumsi", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6109", name: "Beban Pemeliharaan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6110", name: "Beban Penyusutan Peralatan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6111", name: "Beban Penyusutan Kendaraan", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6112", name: "Beban Penyusutan Gedung", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
  { code: "6113", name: "Beban Operasional Lainnya", accountType: "EXPENSE", normalBalance: "DEBIT", isHeader: false, parentCode: "6100", level: 3 },
];
