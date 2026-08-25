import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { PageHeader, Input, Select, Button } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { Navigate } from "react-router-dom";
import { ShieldAlert, Pencil, CheckCircle2, CreditCard, ChevronRight } from "lucide-react";

/* ─────────────────── Bank registry ─────────────────── */
interface BankMeta {
  code: string;
  label: string;
  shortName: string;
}

const BANKS: BankMeta[] = [
  { code: "ID_BCA",      label: "BCA – Bank Central Asia",       shortName: "BCA"      },
  { code: "ID_MANDIRI",  label: "MANDIRI – Bank Mandiri",        shortName: "MANDIRI"  },
  { code: "ID_BNI",      label: "BNI – Bank Negara Indonesia",   shortName: "BNI"      },
  { code: "ID_BRI",      label: "BRI – Bank Rakyat Indonesia",   shortName: "BRI"      },
  { code: "ID_BSI",      label: "BSI – Bank Syariah Indonesia",  shortName: "BSI"      },
  { code: "ID_CIMB",     label: "CIMB – CIMB Niaga",            shortName: "CIMB"     },
  { code: "ID_PERMATA",  label: "PERMATA – Bank Permata",        shortName: "PERMATA"  },
  { code: "ID_DANAMON",  label: "DANAMON – Bank Danamon",        shortName: "DANAMON"  },
  { code: "ID_MUAMALAT", label: "MUAMALAT – Bank Muamalat",     shortName: "MUAMALAT" },
];

const BANK_OPTIONS = [{ code: "", label: "-- Pilih Bank --", shortName: "" }, ...BANKS];

function getBankMeta(code: string): BankMeta | undefined {
  return BANKS.find((b) => b.code === code);
}

function maskAccount(acc: string) {
  if (!acc || acc.length < 4) return acc;
  return "•".repeat(Math.max(0, acc.length - 4)).replace(/(.{4})/g, "$1 ") + acc.slice(-4);
}

/* ─────────────────── Bank Card Preview ─────────────────── */
function BankCardPreview({
  bank,
  accountNumber,
  accountHolder,
}: {
  bank?: BankMeta;
  accountNumber: string;
  accountHolder: string;
}) {
  const masked = accountNumber ? maskAccount(accountNumber) : "•••• •••• ••••";
  const holder = accountHolder || "NAMA PEMILIK REKENING";

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-7 select-none w-full max-w-md mx-auto shadow-xl"
      style={{
        background: "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
        minHeight: 200,
      }}
    >
      {/* shine overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />
      {/* dot pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col h-full gap-6">
        {/* top row: chip + bank name */}
        <div className="flex items-start justify-between">
          {/* chip */}
          <div
            className="w-10 h-7 rounded-md opacity-90"
            style={{ background: "linear-gradient(135deg,#f5c842,#d4a017)" }}
          />
          {/* bank name badge */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
            <span className="font-black text-base tracking-wider text-white/90">
              {bank?.shortName ?? "BANK"}
            </span>
          </div>
        </div>

        {/* account number */}
        <div>
          <p className="text-white/50 text-xs mb-1 font-medium tracking-widest">
            NOMOR REKENING
          </p>
          <p className="text-white font-mono text-xl font-bold tracking-widest">
            {masked}
          </p>
        </div>

        {/* bottom row: holder + card icon */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-xs mb-0.5 font-medium tracking-widest">
              ATAS NAMA
            </p>
            <p className="text-white font-semibold tracking-wide uppercase truncate max-w-xs">
              {holder}
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-white/30" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Info row ─────────────────── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm font-semibold text-primary">{value || "-"}</span>
    </div>
  );
}

/* ─────────────────── Main Page ─────────────────── */
export function BankAccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  if (!user?.lembagaId) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: lembaga, isLoading } = useQuery({
    queryKey: ["lembaga-me"],
    queryFn: async () => {
      const { data } = await api.get<any>("/lembaga/me");
      return data;
    },
  });

  useEffect(() => {
    if (lembaga && !isEditing) {
      setBankCode(lembaga.bankCode || "");
      setAccountNumber(lembaga.accountNumber || "");
      setAccountHolder(lembaga.accountHolder || "");
    }
  }, [lembaga, isEditing]);

  const updateProfile = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.patch("/lembaga/me", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lembaga-me"] });
      toast.success("Informasi rekening bank berhasil diperbarui.");
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Gagal memperbarui rekening bank"
      );
    },
  });

  const handleSave = () => {
    if (!bankCode || !accountNumber || !accountHolder) {
      toast.error("Semua field rekening bank harus diisi.");
      return;
    }
    updateProfile.mutate({
      name: lembaga.name,
      picName: lembaga.picName,
      address: lembaga.address,
      description: lembaga.description,
      bankCode,
      accountNumber,
      accountHolder,
    });
  };

  const isConfigured =
    !!lembaga?.bankCode && !!lembaga?.accountNumber && !!lembaga?.accountHolder;

  /* bank meta for current selection */
  const previewBank = getBankMeta(isEditing ? bankCode : lembaga?.bankCode ?? "");
  const previewNumber = isEditing ? accountNumber : lembaga?.accountNumber ?? "";
  const previewHolder = isEditing ? accountHolder : lembaga?.accountHolder ?? "";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rekening Bank Lembaga"
        description="Kelola informasi rekening bank tujuan pencairan dana (payout)."
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-surface rounded-3xl h-52 border border-border/40" />
          <div className="animate-pulse bg-surface rounded-2xl h-40 border border-border/40" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Bank Card Preview ── */}
          <div className="space-y-3">
            <BankCardPreview
              bank={previewBank}
              accountNumber={previewNumber}
              accountHolder={previewHolder}
            />
          </div>

          {/* ── Warning if not configured ── */}
          {!isConfigured && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20 text-warning text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Rekening Belum Diatur</p>
                <p className="opacity-90">
                  Anda harus mengatur rekening bank sebelum dapat melakukan penarikan dana.
                </p>
              </div>
            </div>
          )}

          {/* ── View Mode ── */}
          {!isEditing ? (
            <div className="bg-surface rounded-2xl border border-border/40 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  {isConfigured ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-secondary" />
                  )}
                  <span className="font-bold text-primary">
                    {isConfigured ? "Rekening Terdaftar" : "Belum Ada Rekening"}
                  </span>
                </div>
                <Button
                  intent="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {isConfigured ? "Ubah" : "Atur Sekarang"}
                </Button>
              </div>

              {/* Info rows */}
              <div className="px-6 py-2">
                <InfoRow
                  label="Bank"
                  value={getBankMeta(lembaga?.bankCode)?.label ?? lembaga?.bankCode ?? "-"}
                />
                <InfoRow
                  label="Nomor Rekening"
                  value={maskAccount(lembaga?.accountNumber ?? "")}
                />
                <InfoRow label="Atas Nama" value={lembaga?.accountHolder ?? "-"} />
              </div>

              {/* Bank list chips */}
              <div className="px-6 pb-5 pt-3 border-t border-border/40">
                <p className="text-xs text-secondary mb-3 font-medium">Bank yang didukung:</p>
                <div className="flex flex-wrap gap-2">
                  {BANKS.map((b) => (
                    <span
                      key={b.code}
                      className="inline-flex items-center rounded-full border border-border/60 bg-surface-muted px-3 py-1 text-xs font-semibold text-secondary"
                    >
                      {b.shortName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Edit Mode ── */
            <div className="bg-surface rounded-2xl border border-border/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
                <Pencil className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-primary">Edit Rekening Bank</span>
              </div>

              <div className="p-6 space-y-5">
                {/* Warning */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Pastikan informasi rekening yang Anda masukkan benar. Kesalahan penulisan
                    dapat menyebabkan pencairan dana gagal atau terkirim ke rekening yang salah.
                  </p>
                </div>

                {/* Bank selector with color chips */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Bank Tujuan</label>
                  <Select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    disabled={updateProfile.isPending}
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.label}
                      </option>
                    ))}
                  </Select>
                  {/* Show selected bank chip */}
                  {bankCode && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-primary">
                        {getBankMeta(bankCode)?.shortName}
                      </span>
                      <span className="text-xs text-secondary">dipilih</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Nomor Rekening</label>
                  <Input
                    placeholder="Masukkan nomor rekening"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    disabled={updateProfile.isPending}
                    maxLength={20}
                  />
                  <p className="text-xs text-secondary">Hanya angka, tanpa spasi atau tanda hubung.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Nama Pemilik Rekening</label>
                  <Input
                    placeholder="Sesuai buku tabungan / KTP"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    disabled={updateProfile.isPending}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    intent="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setBankCode(lembaga?.bankCode || "");
                      setAccountNumber(lembaga?.accountNumber || "");
                      setAccountHolder(lembaga?.accountHolder || "");
                    }}
                    disabled={updateProfile.isPending}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={updateProfile.isPending}
                    className="flex items-center gap-2"
                  >
                    Simpan Perubahan
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
