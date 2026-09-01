/** COA standar untuk buku Lembaga dan buku Platform. */
export type AccountType = "ASSET" | "LIABILITY" | "FUND" | "REVENUE" | "EXPENSE";
export type NormalBalance = "DEBIT" | "CREDIT";
export type CoaScope = "BOTH" | "LEMBAGA" | "PLATFORM";

export const COA_KEYS = {
  ASSETS: "ASSETS",
  CASH_AND_BANK: "CASH_AND_BANK",
  BANK_ACCOUNTS: "BANK_ACCOUNTS",
  BANK: "BANK",
  RECEIVABLES: "RECEIVABLES",
  PAYMENT_GATEWAY_RECEIVABLE: "PAYMENT_GATEWAY_RECEIVABLE",
  FIXED_ASSETS: "FIXED_ASSETS",
  FIXED_ASSET_EQUIPMENT: "FIXED_ASSET_EQUIPMENT",
  ACCUMULATED_DEPRECIATION: "ACCUMULATED_DEPRECIATION",
  LIABILITIES: "LIABILITIES",
  OPERATING_PAYABLE: "OPERATING_PAYABLE",
  TAX_PAYABLE: "TAX_PAYABLE",
  OTHER_PAYABLE: "OTHER_PAYABLE",
  INSTITUTION_FUNDS_PAYABLE: "INSTITUTION_FUNDS_PAYABLE",
  FUND_BALANCES: "FUND_BALANCES",
  ZAKAT_FUND: "ZAKAT_FUND",
  INFAK_SEDEKAH_FUND: "INFAK_SEDEKAH_FUND",
  WAKAF_FUND: "WAKAF_FUND",
  AMIL_FUND: "AMIL_FUND",
  NON_HALAL_FUND: "NON_HALAL_FUND",
  CSR_FUND: "CSR_FUND",
  DSKL_FUND: "DSKL_FUND",
  REVENUE: "REVENUE",
  ZAKAT_REVENUE: "ZAKAT_REVENUE",
  INFAK_SEDEKAH_REVENUE: "INFAK_SEDEKAH_REVENUE",
  WAKAF_REVENUE: "WAKAF_REVENUE",
  AMIL_REVENUE: "AMIL_REVENUE",
  OTHER_REVENUE: "OTHER_REVENUE",
  CSR_REVENUE: "CSR_REVENUE",
  DSKL_REVENUE: "DSKL_REVENUE",
  DISTRIBUTIONS: "DISTRIBUTIONS",
  ZAKAT_DISTRIBUTION: "ZAKAT_DISTRIBUTION",
  INFAK_SEDEKAH_DISTRIBUTION: "INFAK_SEDEKAH_DISTRIBUTION",
  WAKAF_DISTRIBUTION: "WAKAF_DISTRIBUTION",
  CSR_DISTRIBUTION: "CSR_DISTRIBUTION",
  DSKL_DISTRIBUTION: "DSKL_DISTRIBUTION",
  OPERATING_EXPENSES: "OPERATING_EXPENSES",
  SALARY_EXPENSE: "SALARY_EXPENSE",
  UTILITIES_EXPENSE: "UTILITIES_EXPENSE",
  OFFICE_ADMIN_EXPENSE: "OFFICE_ADMIN_EXPENSE",
  TRANSPORT_EXPENSE: "TRANSPORT_EXPENSE",
  BANK_GATEWAY_EXPENSE: "BANK_GATEWAY_EXPENSE",
  MAINTENANCE_EXPENSE: "MAINTENANCE_EXPENSE",
  DEPRECIATION_EXPENSE: "DEPRECIATION_EXPENSE",
  OTHER_OPERATING_EXPENSE: "OTHER_OPERATING_EXPENSE",
  PLATFORM_AMIL_EXPENSE: "PLATFORM_AMIL_EXPENSE",
} as const;

export type CoaKey = (typeof COA_KEYS)[keyof typeof COA_KEYS];

export interface CoaTemplateRow {
  key: CoaKey;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  isHeader: boolean;
  parentCode: string | null;
  level: number;
  scope: CoaScope;
}

const row = (key: CoaKey, code: string, name: string, accountType: AccountType,
  normalBalance: NormalBalance, isHeader: boolean, parentCode: string | null,
  level: number, scope: CoaScope = "BOTH"): CoaTemplateRow =>
  ({ key, code, name, accountType, normalBalance, isHeader, parentCode, level, scope });

export const COA_TEMPLATE: CoaTemplateRow[] = [
  row(COA_KEYS.ASSETS, "1000", "Aset", "ASSET", "DEBIT", true, null, 1),
  row(COA_KEYS.CASH_AND_BANK, "1100", "Kas dan Bank", "ASSET", "DEBIT", true, "1000", 2),
  row(COA_KEYS.BANK_ACCOUNTS, "1103", "Rekening Bank", "ASSET", "DEBIT", true, "1100", 3),
  row(COA_KEYS.BANK, "110399", "Bank Operasional", "ASSET", "DEBIT", false, "1103", 4),
  row(COA_KEYS.RECEIVABLES, "1110", "Piutang", "ASSET", "DEBIT", true, "1000", 2),
  row(COA_KEYS.PAYMENT_GATEWAY_RECEIVABLE, "1111", "Piutang Payment Gateway", "ASSET", "DEBIT", false, "1110", 3),
  row(COA_KEYS.FIXED_ASSETS, "1200", "Aset Tetap", "ASSET", "DEBIT", true, "1000", 2),
  row(COA_KEYS.FIXED_ASSET_EQUIPMENT, "1201", "Peralatan dan Aset Tetap", "ASSET", "DEBIT", false, "1200", 3),
  row(COA_KEYS.ACCUMULATED_DEPRECIATION, "1291", "Akumulasi Penyusutan Aset Tetap", "ASSET", "CREDIT", false, "1200", 3),

  row(COA_KEYS.LIABILITIES, "2000", "Kewajiban", "LIABILITY", "CREDIT", true, null, 1),
  row(COA_KEYS.OPERATING_PAYABLE, "2101", "Utang Operasional", "LIABILITY", "CREDIT", false, "2000", 2),
  row(COA_KEYS.TAX_PAYABLE, "2103", "Utang Pajak", "LIABILITY", "CREDIT", false, "2000", 2),
  row(COA_KEYS.OTHER_PAYABLE, "2104", "Utang Lain-lain", "LIABILITY", "CREDIT", false, "2000", 2),
  row(COA_KEYS.INSTITUTION_FUNDS_PAYABLE, "2105", "Utang Dana Lembaga", "LIABILITY", "CREDIT", false, "2000", 2, "PLATFORM"),

  row(COA_KEYS.FUND_BALANCES, "3000", "Saldo Dana", "FUND", "CREDIT", true, null, 1),
  row(COA_KEYS.ZAKAT_FUND, "3101", "Dana Zakat", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),
  row(COA_KEYS.INFAK_SEDEKAH_FUND, "3102", "Dana Infak/Sedekah", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),
  row(COA_KEYS.WAKAF_FUND, "3104", "Dana Wakaf", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),
  row(COA_KEYS.AMIL_FUND, "3105", "Dana Amil", "FUND", "CREDIT", false, "3000", 2),
  row(COA_KEYS.NON_HALAL_FUND, "3106", "Dana Nonhalal", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),
  row(COA_KEYS.CSR_FUND, "3107", "Dana CSR", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),
  row(COA_KEYS.DSKL_FUND, "3108", "Dana DSKL", "FUND", "CREDIT", false, "3000", 2, "LEMBAGA"),

  row(COA_KEYS.REVENUE, "4000", "Penerimaan Dana", "REVENUE", "CREDIT", true, null, 1),
  row(COA_KEYS.ZAKAT_REVENUE, "4101", "Penerimaan Zakat", "REVENUE", "CREDIT", false, "4000", 2, "LEMBAGA"),
  row(COA_KEYS.INFAK_SEDEKAH_REVENUE, "4102", "Penerimaan Infak/Sedekah", "REVENUE", "CREDIT", false, "4000", 2, "LEMBAGA"),
  row(COA_KEYS.WAKAF_REVENUE, "4104", "Penerimaan Wakaf", "REVENUE", "CREDIT", false, "4000", 2, "LEMBAGA"),
  row(COA_KEYS.AMIL_REVENUE, "4105", "Penerimaan Dana Amil", "REVENUE", "CREDIT", false, "4000", 2),
  row(COA_KEYS.OTHER_REVENUE, "4107", "Penerimaan Lainnya", "REVENUE", "CREDIT", false, "4000", 2),
  row(COA_KEYS.CSR_REVENUE, "4108", "Penerimaan CSR", "REVENUE", "CREDIT", false, "4000", 2, "LEMBAGA"),
  row(COA_KEYS.DSKL_REVENUE, "4109", "Penerimaan DSKL", "REVENUE", "CREDIT", false, "4000", 2, "LEMBAGA"),

  row(COA_KEYS.DISTRIBUTIONS, "5000", "Penyaluran Dana", "EXPENSE", "DEBIT", true, null, 1, "LEMBAGA"),
  row(COA_KEYS.ZAKAT_DISTRIBUTION, "5101", "Penyaluran Zakat", "EXPENSE", "DEBIT", false, "5000", 2, "LEMBAGA"),
  row(COA_KEYS.INFAK_SEDEKAH_DISTRIBUTION, "5102", "Penyaluran Infak/Sedekah", "EXPENSE", "DEBIT", false, "5000", 2, "LEMBAGA"),
  row(COA_KEYS.WAKAF_DISTRIBUTION, "5104", "Penyaluran Wakaf", "EXPENSE", "DEBIT", false, "5000", 2, "LEMBAGA"),
  row(COA_KEYS.CSR_DISTRIBUTION, "5105", "Penyaluran CSR", "EXPENSE", "DEBIT", false, "5000", 2, "LEMBAGA"),
  row(COA_KEYS.DSKL_DISTRIBUTION, "5106", "Penyaluran DSKL", "EXPENSE", "DEBIT", false, "5000", 2, "LEMBAGA"),

  row(COA_KEYS.OPERATING_EXPENSES, "6000", "Beban Operasional", "EXPENSE", "DEBIT", true, null, 1),
  row(COA_KEYS.SALARY_EXPENSE, "6101", "Beban Gaji dan Honor", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.UTILITIES_EXPENSE, "6102", "Beban Utilitas dan Komunikasi", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.OFFICE_ADMIN_EXPENSE, "6105", "Beban Administrasi Kantor", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.TRANSPORT_EXPENSE, "6106", "Beban Transportasi", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.BANK_GATEWAY_EXPENSE, "6107", "Beban Bank dan Payment Gateway", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.MAINTENANCE_EXPENSE, "6109", "Beban Pemeliharaan", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.DEPRECIATION_EXPENSE, "6110", "Beban Penyusutan Aset Tetap", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.OTHER_OPERATING_EXPENSE, "6113", "Beban Operasional Lainnya", "EXPENSE", "DEBIT", false, "6000", 2),
  row(COA_KEYS.PLATFORM_AMIL_EXPENSE, "6114", "Beban Amil Platform", "EXPENSE", "DEBIT", false, "6000", 2, "LEMBAGA"),
];

export function coaTemplateFor(ownerType: "LEMBAGA" | "PLATFORM"): CoaTemplateRow[] {
  return COA_TEMPLATE.filter((account) => account.scope === "BOTH" || account.scope === ownerType);
}
