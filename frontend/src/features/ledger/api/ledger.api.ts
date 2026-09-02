import { api } from "@/lib/api-client";
import type { PaginationMeta } from "@shared/types/api";

export enum NormalBalance {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

// We can reuse some types from journal.api.ts or define them here for independence
export interface LedgerTransaction {
  id: string;
  journalId: string;
  accountId: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string | null;
  createdAt: string;
  journal: {
    id: string;
    journalNo: string;
    journalDate: string;
    description: string;
    sourceType: string;
    status: string;
    program?: {
      id: string;
      title: string;
    };
  };
}

export interface LedgerResponse {
  account: {
    id: string;
    code: string;
    name: string;
    normalBalance: NormalBalance;
  };
  openingBalance: number;
  transactions: LedgerTransaction[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface GetLedgerParams {
  accountId: string;
  lembagaId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const ledgerApi = {
  getLedger: (params: GetLedgerParams) => {
    return api.get<LedgerResponse>("/ledger", params as unknown as Record<string, unknown>);
  },
};
