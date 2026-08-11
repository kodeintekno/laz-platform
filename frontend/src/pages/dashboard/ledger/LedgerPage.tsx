import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { ledgerApi, GetLedgerParams } from "@/features/ledger/api/ledger.api";
import { PageHeader, Button, Card, Input, Select, TableSkeleton, Pagination } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { Search } from "lucide-react";

export function LedgerPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const defaultStartDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const defaultEndDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

  const [accountId, setAccountId] = useState<string>(searchParams.get("accountId") || "");
  const [startDate, setStartDate] = useState<string>(searchParams.get("startDate") || defaultStartDate);
  const [endDate, setEndDate] = useState<string>(searchParams.get("endDate") || defaultEndDate);
  
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);

  // Fetch COA for dropdown
  const { data: coaResult } = useQuery({
    queryKey: ["coa"],
    queryFn: () => api.get<any[]>("/coa"),
  });

  // Filter out headers for selection
  const accounts = coaResult?.data?.filter((acc) => !acc.isHeader) || [];
  
  const queryParams: GetLedgerParams = {
    accountId,
    startDate,
    endDate,
    page,
    limit,
  };

  const { data: ledgerResult, isLoading, isError, error } = useQuery({
    queryKey: ["ledger", queryParams],
    queryFn: () => ledgerApi.getLedger(queryParams),
    enabled: !!accountId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      accountId,
      startDate,
      endDate,
      page: "1",
      limit: limit.toString(),
    });
  };

  const ledgerData = ledgerResult?.data;
  const pagination = ledgerResult?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Besar"
        description="Laporan detail mutasi dan saldo per akun."
      />

      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Akun</label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              <option value="">Pilih Akun...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium mb-1">Tanggal Akhir</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" intent="primary" className="w-full md:w-auto">
            <Search className="w-4 h-4 mr-2" />
            Tampilkan
          </Button>
        </form>
      </Card>

      {accountId && !ledgerData && isLoading && (
        <TableSkeleton headers={["Tanggal", "No. Jurnal", "Keterangan", "Source", "Debit", "Kredit", "Saldo"]} rowCount={10} columnTypes={["text", "text", "text", "text", "text", "text", "text"]} />
      )}
      
      {isError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Gagal memuat buku besar: {(error as any)?.message || "Terjadi kesalahan"}
        </div>
      )}

      {ledgerData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-center">
              <span className="text-sm text-secondary">Saldo Awal</span>
              <span className="text-xl font-bold">{formatCurrency(ledgerData.openingBalance)}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center">
              <span className="text-sm text-secondary">Total Debit</span>
              <span className="text-xl font-bold text-emerald-600">{formatCurrency(ledgerData.totalDebit)}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center">
              <span className="text-sm text-secondary">Total Kredit</span>
              <span className="text-xl font-bold text-rose-600">{formatCurrency(ledgerData.totalCredit)}</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center">
              <span className="text-sm text-secondary">Saldo Akhir</span>
              <span className="text-xl font-bold">{formatCurrency(ledgerData.closingBalance)}</span>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-hover flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{ledgerData.account.code} - {ledgerData.account.name}</h3>
                <p className="text-sm text-secondary">Normal Balance: <span className="font-medium text-foreground">{ledgerData.account.normalBalance}</span></p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-hover text-secondary border-b border-border uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">No. Jurnal</th>
                    <th className="px-4 py-3 min-w-[200px]">Keterangan</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Kredit</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ledgerData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-secondary">
                        Belum ada transaksi untuk akun ini pada periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(trx.journal.journalDate).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link 
                            to={`/dashboard/journal/${trx.journal.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {trx.journal.journalNo}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {trx.journal.program ? (
                            <span className="font-medium">{trx.description || trx.journal.description} - {trx.journal.program.title}</span>
                          ) : (
                            <span>{trx.description || trx.journal.description}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-hover border border-border">
                            {trx.journal.sourceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {trx.debit > 0 ? formatCurrency(trx.debit) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {trx.credit > 0 ? formatCurrency(trx.credit) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                          {formatCurrency(trx.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.total}
                  pageSize={pagination.limit}
                />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
