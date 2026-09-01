import { useState } from "react";
import { useGetMyWithdrawals, useCreateWithdrawal, useBankAccounts, Withdrawal } from "../api/withdrawals";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
} from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { formatCurrency } from "@/lib/utils";

export function LembagaWithdrawalPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["lembaga-me"],
    queryFn: async () => {
      const { data } = await api.get("/lembaga/me");
      return data;
    },
  });

  const { data: withdrawals, isLoading, refetch: refetchWithdrawals } = useGetMyWithdrawals(page, 10);
  const createWithdrawal = useCreateWithdrawal();
  const { data: bankAccounts = [] } = useBankAccounts();

  const balance = (myProfile as any)?.balance?.balance ? Number((myProfile as any).balance.balance) : 0;
  const reservedBalance = (myProfile as any)?.balance?.reservedBalance ? Number((myProfile as any).balance.reservedBalance) : 0;

  const selectedBank = bankAccounts.find((bank) => bank.id === bankAccountId)
    ?? bankAccounts.find((bank) => bank.isDefault)
    ?? bankAccounts[0];
  const isBankConfigured = bankAccounts.length > 0;

  const handleWithdraw = async () => {
    const numAmount = parseInt(amount.replace(/\D/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Masukkan nominal pencairan yang valid");
      return;
    }

    if (numAmount > balance) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    try {
      if (!selectedBank) {
        toast.error("Pilih rekening Bank tujuan pencairan");
        return;
      }
      await createWithdrawal.mutateAsync({ amount: numAmount, bankAccountId: selectedBank.id });
      toast.success("Pengajuan pencairan berhasil dibuat!");
      setAmount("");
      refetchProfile();
      refetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal membuat pengajuan pencairan");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge intent="warning">PENDING</Badge>;
      case "APPROVED":
        return <Badge intent="info">APPROVED</Badge>;
      case "PROCESSING":
        return <Badge intent="warning">PROCESSING</Badge>;
      case "COMPLETED":
        return <Badge intent="success">COMPLETED</Badge>;
      case "REJECTED":
      case "FAILED":
      case "REVERSED":
        return <Badge intent="destructive">{status}</Badge>;
      default:
        return <Badge intent="muted">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-surface-stronger">Pengajuan Penarikan</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Penarikan Tersedia</CardTitle>
            <p className="text-sm text-surface-strong">Total dana lembaga yang masih tersedia di payment gateway</p>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {formatCurrency(balance)}
            </div>
            {reservedBalance > 0 && (
              <div className="mt-2 text-sm text-surface-strong">
                <span className="font-medium text-warning">{formatCurrency(reservedBalance)}</span> sedang dalam proses pencairan.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajukan Pencairan</CardTitle>
            <p className="text-sm text-surface-strong">Cairkan dana ke rekening lembaga Anda</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isBankConfigured ? (
              <div className="p-4 bg-warning/10 text-warning rounded-lg text-sm">
                Anda belum mengatur informasi rekening bank. Silakan lengkapi di halaman Pengaturan terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rekening Tujuan</label>
                <Select value={selectedBank?.id ?? ""} onChange={(event) => setBankAccountId(event.target.value)}>
                  {bankAccounts.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.label || bank.chartOfAccount.name} — {bank.accountNumber} a.n. {bank.accountHolder}
                    </option>
                  ))}
                </Select>
                {selectedBank && (
                  <p className="text-xs text-secondary">
                    Jurnal otomatis masuk ke COA {selectedBank.chartOfAccount.code} {selectedBank.chartOfAccount.name}.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal Pencairan</label>
              <Input
                type="text"
                placeholder="Rp 0"
                value={amount ? formatCurrency(parseInt(amount)) : ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAmount(val);
                }}
                disabled={!isBankConfigured || createWithdrawal.isPending}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={!isBankConfigured || !amount || createWithdrawal.isPending}
              isLoading={createWithdrawal.isPending}
            >
              Ajukan Pencairan
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pencairan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Memuat...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-surface-strong uppercase bg-surface-soft">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Bank Tujuan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals?.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-surface-strong">
                        Belum ada riwayat pencairan
                      </td>
                    </tr>
                  )}
                  {withdrawals?.data?.map((w: Withdrawal) => (
                    <tr key={w.id} className="border-b border-surface-soft">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(Number(w.amount))}
                      </td>
                      <td className="px-4 py-3">
                        {w.bankCode} - {w.accountNumber} <br />
                        <span className="text-xs text-surface-strong">{w.accountHolder}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(w.status)}</td>
                      <td className="px-4 py-3 text-destructive max-w-xs truncate">
                        {w.rejectionReason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
