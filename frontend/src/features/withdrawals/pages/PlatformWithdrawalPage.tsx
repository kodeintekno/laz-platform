import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCreatePlatformWithdrawal,
  usePlatformBalance,
  useSavePlatformBankAccount,
} from "../api/withdrawals";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/stores/toast.store";
import { ArrowRight, Landmark, PiggyBank, Wallet } from "lucide-react";
import { BANK_OPTIONS } from "../constants/banks";
import { formatIdrAmountInput } from "../utils/amount";

export function PlatformWithdrawalPage() {
  const { data: platformBalance, isLoading } = usePlatformBalance();
  const saveBank = useSavePlatformBankAccount();
  const createWithdrawal = useCreatePlatformWithdrawal();
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    if (!platformBalance) return;
    setBankCode(platformBalance.bankCode ?? "");
    setAccountNumber(platformBalance.accountNumber ?? "");
    setAccountHolder(platformBalance.accountHolder ?? "");
  }, [platformBalance]);

  const availableBalance = Number(platformBalance?.balance ?? 0);
  const reservedBalance = Number(platformBalance?.reservedBalance ?? 0);
  const isBankConfigured = Boolean(
    platformBalance?.bankCode && platformBalance.accountNumber && platformBalance.accountHolder,
  );

  const handleSaveBank = async () => {
    if (!bankCode.trim() || !/^\d{5,30}$/.test(accountNumber.trim()) || !accountHolder.trim()) {
      toast.error("Bank, nomor rekening 5-30 digit, dan nama pemilik wajib diisi");
      return;
    }
    try {
      await saveBank.mutateAsync({
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
      toast.success("Rekening Platform berhasil disimpan");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan rekening Platform");
    }
  };

  const handleWithdraw = async () => {
    const parsedAmount = Number(amount.replace(/\D/g, ""));
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast.error("Masukkan nominal penarikan yang valid");
      return;
    }
    if (parsedAmount > availableBalance) {
      toast.error("Saldo amil Platform tidak mencukupi");
      return;
    }
    if (!isBankConfigured) {
      toast.error("Simpan rekening Platform terlebih dahulu");
      return;
    }
    try {
      await createWithdrawal.mutateAsync(parsedAmount);
      setAmount("");
      toast.success("Pengajuan penarikan amil Platform berhasil dibuat");
    } catch (error: any) {
      toast.error(error?.message || "Gagal membuat penarikan amil Platform");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penarikan Porsi Amil Platform"
        description="Tarik saldo porsi amil milik Platform ke rekening bank yang telah diverifikasi."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="border-0 bg-gradient-to-br from-emerald-950 to-teal-800 text-white">
          <CardContent className="p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-emerald-100/70">Saldo Amil Platform Tersedia</p>
                <p className="mt-3 text-3xl font-black">
                  {isLoading ? "—" : formatCurrency(availableBalance)}
                </p>
              </div>
              <span className="rounded-2xl bg-white/10 p-3"><Wallet className="h-6 w-6" /></span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-secondary">Saldo Direservasi</p>
                <p className="mt-3 text-3xl font-black text-primary">
                  {isLoading ? "—" : formatCurrency(reservedBalance)}
                </p>
              </div>
              <span className="rounded-2xl bg-amber-50 p-3 text-amber-600"><PiggyBank className="h-6 w-6" /></span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Rekening Tujuan Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Bank</label>
              <Select value={bankCode} onChange={(event) => setBankCode(event.target.value)}>
                <option value="">Pilih Bank</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.value} value={bank.value}>{bank.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nomor Rekening</label>
              <Input
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                placeholder="Nomor rekening 5-30 digit"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Pemilik Rekening</label>
              <Input value={accountHolder} onChange={(event) => setAccountHolder(event.target.value)} />
            </div>
            <Button onClick={handleSaveBank} isLoading={saveBank.isPending}>Simpan Rekening</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buat Pengajuan Penarikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-soft p-4 text-sm">
              <span className="text-secondary">Status rekening</span>
              <Badge intent={isBankConfigured ? "success" : "warning"}>
                {isBankConfigured ? "Siap digunakan" : "Belum lengkap"}
              </Badge>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nominal Penarikan</label>
              <Input
                value={amount}
                onChange={(event) => setAmount(formatIdrAmountInput(event.target.value))}
                placeholder="Contoh: 1.000.000"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-secondary">Maksimum {formatCurrency(availableBalance)}</p>
            </div>
            <Button
              onClick={handleWithdraw}
              isLoading={createWithdrawal.isPending}
              disabled={!isBankConfigured || availableBalance <= 0}
            >
              Ajukan Penarikan
            </Button>
            <p className="text-xs text-secondary">
              Pengajuan akan masuk ke antrean verifikasi sebelum payout diproses.
            </p>
            <Link to="/dashboard/withdrawals" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
              Lihat antrean penarikan <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
