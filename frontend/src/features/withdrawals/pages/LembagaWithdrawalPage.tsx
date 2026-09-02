import { useState } from "react";
import {
  useGetMyWithdrawals,
  useCreateWithdrawal,
  useBankAccounts,
  useProgramWithdrawalBalances,
  Withdrawal,
} from "../api/withdrawals";
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
import { ArrowDownToLine, CheckCircle2, Clock3, Landmark, Layers3, Wallet } from "lucide-react";
import { formatIdrAmountInput } from "../utils/amount";

export function LembagaWithdrawalPage() {
  const [page] = useState(1);
  const [amount, setAmount] = useState("");
  const [programId, setProgramId] = useState("");

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
  const { data: programBalances = [], refetch: refetchProgramBalances } = useProgramWithdrawalBalances();

  const balance = (myProfile as any)?.balance?.balance ? Number((myProfile as any).balance.balance) : 0;
  const reservedBalance = (myProfile as any)?.balance?.reservedBalance ? Number((myProfile as any).balance.reservedBalance) : 0;

  const selectedBank = bankAccounts[0];
  const selectedProgram = programBalances.find((item) => item.programId === programId);
  const selectedProgramBalance = selectedProgram ? Number(selectedProgram.balance) : 0;
  const isBankConfigured = bankAccounts.length > 0;
  const withdrawableProgramCount = programBalances.filter((item) => Number(item.balance) > 0).length;

  const handleWithdraw = async () => {
    const numAmount = parseInt(amount.replace(/\D/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Masukkan nominal pencairan yang valid");
      return;
    }

    if (!selectedProgram) {
      toast.error("Pilih program sumber dana");
      return;
    }

    if (numAmount > selectedProgramBalance) {
      toast.error("Saldo program tidak mencukupi");
      return;
    }

    try {
      if (!selectedBank) {
        toast.error("Rekening Bank lembaga belum dikonfigurasi");
        return;
      }
      await createWithdrawal.mutateAsync({ amount: numAmount, programId: selectedProgram.programId });
      toast.success("Pengajuan pencairan berhasil dibuat!");
      setAmount("");
      refetchProfile();
      refetchProgramBalances();
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)] gap-5">
        <Card className="relative border-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white shadow-xl shadow-emerald-950/10">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]" />
          <CardContent className="relative flex min-h-[210px] flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Saldo Utama Lembaga</p>
                <p className="mt-2 text-sm text-emerald-50/70">Total dana tersedia di payment gateway</p>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                <Wallet className="h-6 w-6" />
              </span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight">{formatCurrency(balance)}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-xs text-emerald-50/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Saldo merupakan gabungan seluruh program
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-secondary">Sedang Diproses</p>
                <p className="mt-2 text-2xl font-black text-primary">{formatCurrency(reservedBalance)}</p>
              </div>
              <span className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-8 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-secondary">
                  <Layers3 className="h-4 w-4" /> Program dengan saldo
                </span>
                <span className="font-bold text-primary">{withdrawableProgramCount} dari {programBalances.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Saldo Dana per Program</h2>
            <p className="text-sm text-secondary">Pilih kartu program sebagai sumber dana pencairan.</p>
          </div>
          <p className="text-xs text-secondary">Saldo setiap program tersimpan dan divalidasi secara terpisah.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programBalances.map((item) => {
            const available = Number(item.balance);
            const reserved = Number(item.reservedBalance);
            const isSelected = programId === item.programId;
            const canWithdraw = available > 0;

            return (
              <button
                key={item.programId}
                type="button"
                disabled={!canWithdraw}
                onClick={() => {
                  setProgramId(item.programId);
                  setAmount("");
                }}
                className={`group rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/15"
                    : canWithdraw
                      ? "border-border/50 bg-surface hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-md"
                      : "cursor-not-allowed border-border/30 bg-surface-soft/60 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`rounded-xl p-2.5 ${isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                      <Layers3 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-primary">{item.program.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">{item.program.status.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  {isSelected
                    ? <Badge intent="success">Dipilih</Badge>
                    : <Badge intent={canWithdraw ? "success" : "muted"}>{canWithdraw ? "Tersedia" : "Habis"}</Badge>}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-secondary">Dapat ditarik</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-primary">{formatCurrency(available)}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 text-xs">
                  <div>
                    <p className="text-secondary">Dana program</p>
                    <p className="mt-1 font-semibold text-primary">{formatCurrency(Number(item.mustahiqBalance))}</p>
                  </div>
                  <div>
                    <p className="text-secondary">Dana amil</p>
                    <p className="mt-1 font-semibold text-primary">{formatCurrency(Number(item.amilBalance))}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg bg-amber-50/70 px-3 py-2">
                    <p className="text-amber-700">Sedang diproses</p>
                    <p className="font-semibold text-amber-700">{formatCurrency(reserved)}</p>
                  </div>
                </div>
              </button>
            );
          })}

          {!programBalances.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface-soft/50 p-8 text-center">
              <Layers3 className="mx-auto h-8 w-8 text-secondary/50" />
              <p className="mt-3 font-semibold text-primary">Belum ada saldo program</p>
              <p className="mt-1 text-sm text-secondary">Saldo akan muncul setelah program menerima donasi berhasil.</p>
            </div>
          )}
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/40">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <ArrowDownToLine className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Ajukan Pencairan</CardTitle>
              <p className="mt-1 text-sm text-secondary">Dana ditransfer ke satu rekening resmi Lembaga.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 sm:p-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Sumber Dana Terpilih</p>
              {selectedProgram ? (
                <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="font-bold text-primary">{selectedProgram.program.title}</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-sm text-secondary">Saldo maksimal</p>
                    <p className="text-xl font-black text-emerald-700">{formatCurrency(selectedProgramBalance)}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border border-dashed border-border bg-surface-soft/50 p-4 text-sm text-secondary">
                  Pilih salah satu kartu program di atas untuk melanjutkan.
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Rekening Tujuan</p>
              {!isBankConfigured ? (
                <div className="mt-2 rounded-2xl bg-warning/10 p-4 text-sm text-warning">
                  Rekening Bank belum diatur. Lengkapi melalui halaman Pengaturan.
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border/50 bg-surface-soft/50 p-4">
                  <span className="rounded-xl bg-surface p-2.5 text-primary shadow-sm">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-primary">
                      {selectedBank?.bankCode.replace(/^ID_/, "")} • {selectedBank?.accountNumber}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-secondary">a.n. {selectedBank?.accountHolder}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program Sumber Dana</label>
              <Select
                value={programId}
                onChange={(event) => {
                  setProgramId(event.target.value);
                  setAmount("");
                }}
                disabled={!isBankConfigured || createWithdrawal.isPending}
              >
                <option value="">Pilih program</option>
                {programBalances.map((item) => (
                  <option key={item.programId} value={item.programId} disabled={Number(item.balance) <= 0}>
                    {item.program.title} — {formatCurrency(Number(item.balance))}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal Pencairan</label>
              <Input
                type="text"
                placeholder="Rp 0"
                value={amount ? formatCurrency(parseInt(amount)) : ""}
                onChange={(event) => setAmount(formatIdrAmountInput(event.target.value))}
                disabled={!isBankConfigured || !selectedProgram || selectedProgramBalance <= 0 || createWithdrawal.isPending}
              />
              {selectedProgram && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    onClick={() => setAmount(formatIdrAmountInput(Math.floor(selectedProgramBalance)))}
                  >
                    Tarik seluruh saldo
                  </button>
                </div>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={!isBankConfigured || !selectedProgram || selectedProgramBalance <= 0 || !amount || createWithdrawal.isPending}
              isLoading={createWithdrawal.isPending}
            >
              Ajukan Pencairan
            </Button>
            <p className="text-center text-xs leading-relaxed text-secondary">
              Saldo dikunci setelah diajukan dan baru dikurangi permanen ketika transfer berhasil.
            </p>
          </div>
        </CardContent>
      </Card>

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
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Bank Tujuan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals?.data?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-surface-strong">
                        Belum ada riwayat pencairan
                      </td>
                    </tr>
                  )}
                  {withdrawals?.data?.map((w: Withdrawal) => (
                    <tr key={w.id} className="border-b border-surface-soft">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 font-medium">{w.program?.title || "Data lama"}</td>
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
