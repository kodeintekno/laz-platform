import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Building2, CheckCircle2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, Input, Select, Button, Card, CardContent } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import {
  useBankAccounts,
  useSaveBankAccount,
  useDeactivateBankAccount,
  type LembagaBankAccount,
} from "@/features/withdrawals/api/withdrawals";

const BANKS = [
  ["ID_BCA", "BCA – Bank Central Asia"],
  ["ID_MANDIRI", "MANDIRI – Bank Mandiri"],
  ["ID_BNI", "BNI – Bank Negara Indonesia"],
  ["ID_BRI", "BRI – Bank Rakyat Indonesia"],
  ["ID_BSI", "BSI – Bank Syariah Indonesia"],
  ["ID_CIMB", "CIMB – CIMB Niaga"],
  ["ID_PERMATA", "PERMATA – Bank Permata"],
  ["ID_DANAMON", "DANAMON – Bank Danamon"],
  ["ID_MUAMALAT", "MUAMALAT – Bank Muamalat"],
] as const;

type FormState = {
  id?: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  label: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  bankCode: "", accountNumber: "", accountHolder: "", label: "", isDefault: false,
};

export function BankAccountPage() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading } = useBankAccounts();
  const save = useSaveBankAccount();
  const deactivate = useDeactivateBankAccount();
  const [form, setForm] = useState<FormState | null>(null);

  if (!user?.lembagaId) return <Navigate to="/dashboard" replace />;

  const edit = (account: LembagaBankAccount, makeDefault = false) => setForm({
    id: account.id,
    bankCode: account.bankCode,
    accountNumber: account.accountNumber,
    accountHolder: account.accountHolder,
    label: account.label ?? "",
    isDefault: makeDefault || account.isDefault,
  });

  const submit = async () => {
    if (!form?.bankCode || !/^\d{5,30}$/.test(form.accountNumber) || !form.accountHolder.trim()) {
      toast.error("Lengkapi Bank, nomor rekening 5-30 digit, dan nama pemilik.");
      return;
    }
    try {
      await save.mutateAsync(form);
      toast.success(form.id ? "Rekening berhasil diperbarui." : "Rekening dan akun COA berhasil dibuat.");
      setForm(null);
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan rekening Bank");
    }
  };

  const remove = async (account: LembagaBankAccount) => {
    if (!window.confirm(`Nonaktifkan rekening ${account.chartOfAccount.name}?`)) return;
    try {
      await deactivate.mutateAsync(account.id);
      toast.success("Rekening berhasil dinonaktifkan.");
    } catch (error: any) {
      toast.error(error?.message || "Rekening tidak dapat dinonaktifkan");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Rekening Bank Lembaga"
        description="Kelola beberapa rekening pencairan. Setiap rekening otomatis mempunyai akun COA sendiri." />

      <div className="flex justify-end">
        <Button onClick={() => setForm({ ...emptyForm, isDefault: accounts.length === 0 })}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Rekening
        </Button>
      </div>

      {form && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-primary">{form.id ? "Ubah Rekening" : "Tambah Rekening"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank</label>
                <Select value={form.bankCode} onChange={(event) => setForm({ ...form, bankCode: event.target.value })}>
                  <option value="">Pilih Bank</option>
                  {BANKS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama/Label Rekening (opsional)</label>
                <Input value={form.label} placeholder="Contoh: Mandiri Operasional"
                  onChange={(event) => setForm({ ...form, label: event.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor Rekening</label>
                <Input value={form.accountNumber} maxLength={30}
                  onChange={(event) => setForm({ ...form, accountNumber: event.target.value.replace(/\D/g, "") })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Atas Nama</label>
                <Input value={form.accountHolder}
                  onChange={(event) => setForm({ ...form, accountHolder: event.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} disabled={!!form.id && form.isDefault}
                onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
              Jadikan rekening utama
            </label>
            <div className="flex justify-end gap-2">
              <Button intent="outline" onClick={() => setForm(null)}>Batal</Button>
              <Button onClick={submit} isLoading={save.isPending}>Simpan</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? <p className="text-secondary">Memuat rekening...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-blue-50"><Building2 className="w-5 h-5 text-blue-600" /></span>
                    <div>
                      <p className="font-bold text-primary">{account.label || account.chartOfAccount.name}</p>
                      <p className="text-sm text-secondary">{account.bankCode.replace(/^ID_/, "")} · {account.accountNumber}</p>
                    </div>
                  </div>
                  {account.isDefault && <span className="inline-flex items-center gap-1 text-xs text-amber-700"><Star className="w-3 h-3" /> Utama</span>}
                </div>
                <div className="rounded-lg bg-surface-soft p-3 text-sm">
                  <p>a.n. <strong>{account.accountHolder}</strong></p>
                  <p className="mt-1 text-secondary">COA: <strong>{account.chartOfAccount.code} — {account.chartOfAccount.name}</strong></p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" intent="outline" onClick={() => edit(account)}><Pencil className="w-4 h-4 mr-1" /> Ubah</Button>
                  {!account.isDefault && (
                    <Button size="sm" intent="outline" onClick={() => edit(account, true)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Jadikan Utama
                    </Button>
                  )}
                  <Button size="sm" intent="destructive" onClick={() => remove(account)} disabled={deactivate.isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!accounts.length && <p className="text-secondary">Belum ada rekening Bank. Tambahkan rekening pertama untuk mulai melakukan pencairan.</p>}
        </div>
      )}
    </div>
  );
}
