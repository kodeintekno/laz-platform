import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/auth/AuthProvider";
import { useSearchParams } from "react-router-dom";
import { CoaTree, type CoaAccount } from "@/features/coa/components/CoaTree";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserLembagaFilter } from "@/features/users/components/UserLembagaFilter";
import { Info, BookMarked, RefreshCw } from "lucide-react";
import { provisionCoaAction } from "@/features/coa/actions/coa.actions";
import { toast } from "@/stores/toast.store";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, Input, Select } from "@/components/ui";
import { Plus } from "lucide-react";
import { useState } from "react";

const EXPECTED_LEMBAGA_COA_COUNT = 45;

function CoaSkeletonRow({ indent = 0 }: { indent?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40"
      style={{ paddingLeft: `${16 + indent * 20}px` }}
    >
      <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
      <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
      <Skeleton variant="text" className="w-12 h-4" />
      <Skeleton variant="text" className="flex-1 h-4 max-w-xs" />
    </div>
  );
}

function CoaSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-soft border-b border-border">
        <Skeleton variant="text" className="w-32 h-3" />
      </div>
      {/* Root accounts */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <CoaSkeletonRow indent={0} />
          {i % 2 === 0 && (
            <>
              <CoaSkeletonRow indent={1} />
              <CoaSkeletonRow indent={2} />
              <CoaSkeletonRow indent={2} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function CoaPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = searchParams.get("lembagaId") ?? undefined;
  const isPlatformBook = isSuperAdmin && searchParams.get("scope") === "platform";

  // Fetch COA — LEMBAGA_ADMIN auto-scoped, SUPER_ADMIN needs ?lembagaId=
  const params = isPlatformBook ? { scope: "platform" } : isSuperAdmin && lembagaId ? { lembagaId } : undefined;
  const enabled = isSuperAdmin ? isPlatformBook || !!lembagaId : true;

  const { data: result, isLoading } = useQuery({
    queryKey: ["coa", { lembagaId, isPlatformBook }],
    queryFn: () => api.get<CoaAccount[]>("/coa", params),
    enabled,
  });

  const { data: lembagasResult } = useQuery({
    queryKey: ["lembaga", "options"],
    queryFn: () => api.get<any>("/lembaga/options"),
    enabled: isSuperAdmin,
  });

  const accounts = result?.data ?? [];
  const totalDetail = accounts.filter((a) => !a.isHeader).length;
  const totalHeader = accounts.filter((a) => a.isHeader).length;
  const [showCustomForm, setShowCustomForm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Daftar akun standar yang digunakan sebagai fondasi pencatatan keuangan lembaga."
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/60">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Struktur utama COA ditentukan oleh sistem. Setiap Lembaga dapat menambahkan
          <strong> akun detail sendiri</strong> di bawah header yang tersedia.
          Akun dengan label <strong>Header</strong> hanya berfungsi sebagai pengelompokan
          dan tidak dapat digunakan dalam jurnal transaksi.
        </p>
      </div>

      {/* Lembaga filter for SUPER_ADMIN */}
      {isSuperAdmin && lembagasResult?.data?.length && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary font-medium">Filter Lembaga:</span>
          <UserLembagaFilter lembagas={lembagasResult.data} includePlatform />
        </div>
      )}

      {/* No lembaga selected (SUPER_ADMIN) */}
      {isSuperAdmin && !lembagaId && !isPlatformBook && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookMarked className="w-14 h-14 text-secondary/30 mb-4" />
          <h3 className="font-semibold text-primary mb-1">Pilih Lembaga</h3>
          <p className="text-sm text-secondary max-w-xs">
            Pilih lembaga di atas untuk melihat Chart of Accounts-nya.
          </p>
        </div>
      )}

      {/* Stats & Actions */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-secondary">
            <span>
              <strong className="text-primary">{accounts.length}</strong> total akun
            </span>
            <span>
              <strong className="text-primary">{totalDetail}</strong> akun detail
            </span>
            <span>
              <strong className="text-primary">{totalHeader}</strong> header group
            </span>
          </div>
          
          {!isPlatformBook && (
            <div className="flex gap-2">
              <Button intent="outline" size="sm" onClick={() => setShowCustomForm((value) => !value)}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Akun Anak
              </Button>
              {accounts.filter((account) => account.isSystem).length < EXPECTED_LEMBAGA_COA_COUNT && (
                <SyncCoaButton lembagaId={lembagaId} />
              )}
            </div>
          )}
        </div>
      )}

      {showCustomForm && !isPlatformBook && (
        <CustomCoaForm accounts={accounts} lembagaId={lembagaId} onClose={() => setShowCustomForm(false)} />
      )}

      {/* COA Tree */}
      {(isSuperAdmin ? isPlatformBook || !!lembagaId : true) && (
        isLoading ? <CoaSkeleton /> : <CoaTree accounts={accounts} />
      )}
    </div>
  );
}

function CustomCoaForm({ accounts, lembagaId, onClose }: {
  accounts: CoaAccount[]; lembagaId?: string; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const headers = accounts.filter((account) => account.isHeader && account.level < 4);
  const [parentId, setParentId] = useState(headers[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.post("/coa/accounts", { lembagaId, parentId, code, name }),
    onSuccess: () => {
      toast.success("Akun anak berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["coa"] });
      onClose();
    },
    onError: (error: any) => toast.error(error?.message || "Gagal membuat akun anak"),
  });

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-bold text-primary">Tambah Akun COA Anak</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Akun Induk</label>
            <Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
              {headers.map((account) => <option key={account.id} value={account.id}>{account.code} — {account.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kode Akun</label>
            <Input value={code} placeholder="Contoh: 610501" maxLength={12}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Akun</label>
            <Input value={name} placeholder="Contoh: Beban ATK Cabang"
              onChange={(event) => setName(event.target.value)} />
          </div>
        </div>
        <p className="text-xs text-secondary">Jenis akun dan saldo normal otomatis mengikuti akun induk.</p>
        <div className="flex justify-end gap-2">
          <Button intent="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending} disabled={!parentId || !code || !name}>Simpan</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SyncCoaButton({ lembagaId }: { lembagaId?: string }) {
  const queryClient = useQueryClient();
  const { mutate: provision, isPending } = useMutation({
    mutationFn: () => provisionCoaAction(lembagaId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Chart of Accounts berhasil disinkronisasi");
        queryClient.invalidateQueries({ queryKey: ["coa"] });
      } else {
        toast.error(res.error || "Gagal sinkronisasi Chart of Accounts");
      }
    },
    onError: () => toast.error("Terjadi kesalahan sistem"),
  });

  return (
    <Button 
      intent="outline" 
      size="sm" 
      onClick={() => provision()} 
      isLoading={isPending}
      className="flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Sync COA yang Kurang
    </Button>
  );
}
