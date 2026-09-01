import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import { voidJournalAction } from "@/features/journal/actions/journal.actions";
import { PageHeader, Breadcrumbs, Button, Skeleton, Badge, Card, CardContent, FormWrapper, FormField, Dialog } from "@/components/ui";
import { JournalDetailLines } from "@/features/journal/components/JournalDetailLines";
import { toast } from "@/stores/toast.store";
import { voidJournalSchema, type VoidJournalInput } from "@shared/validations/journal.schema";
import { Edit, CheckCircle2, Ban } from "lucide-react";

export function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.roleName === "SUPER_ADMIN";
  const lembagaId = searchParams.get("lembagaId") ?? undefined;
  const isPlatformBook = isSuperAdmin && searchParams.get("scope") === "platform";

  const [isPending, startTransition] = useTransition();
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  const params = isPlatformBook ? { scope: "platform" } : isSuperAdmin && lembagaId ? { lembagaId } : undefined;

  const { data: result, isLoading } = useQuery({
    queryKey: ["journal", id, { lembagaId, isPlatformBook }],
    queryFn: () => api.get<any>(`/journal/${id}`, params),
    enabled: !!id,
  });

  const journal = result?.data;



  const handleVoid = (data: VoidJournalInput) => {
    startTransition(async () => {
      const res = await voidJournalAction(id!, data, lembagaId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Jurnal berhasil dibatalkan (void)");
        setIsVoidModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["journal", id] });
        queryClient.invalidateQueries({ queryKey: ["journal"] });
      }
    });
  };

  if (isLoading) {
    return <Skeleton variant="rectangular" className="h-96 w-full rounded-xl" />;
  }

  if (!journal) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
        <p className="font-bold">Jurnal tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader
          title={`Jurnal: ${journal.journalNo}`}
          description={journal.description}
        />
        
        <div className="flex flex-wrap gap-2 pt-1">

          
          {!isPlatformBook && journal.status === "POSTED" && can(PERMISSIONS.JOURNAL_VOID) && (
            <Button intent="destructive" onClick={() => setIsVoidModalOpen(true)} disabled={isPending}>
              <Ban className="w-4 h-4 mr-2" />
              Void Jurnal
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs text-secondary font-medium uppercase mb-1">Status</p>
              <Badge
                intent={
                  journal.status === "POSTED" ? "success" :
                  journal.status === "VOID" ? "destructive" : "warning"
                }
                className="text-sm px-2 py-1"
              >
                {journal.status}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs text-secondary font-medium uppercase mb-1">Tanggal</p>
              <p className="text-sm font-medium text-primary">
                {formatDate(journal.journalDate, "dd MMMM yyyy")}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-secondary font-medium uppercase mb-1">Sumber</p>
              <Badge intent="muted">{journal.sourceType}</Badge>
            </div>
            
            {journal.program && (
              <div>
                <p className="text-xs text-secondary font-medium uppercase mb-1">Program Terkait</p>
                <p className="text-sm font-medium text-primary">{journal.program.title}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-border mt-2 space-y-3">
              <div>
                <p className="text-xs text-secondary font-medium uppercase mb-1">Dibuat Oleh</p>
                <p className="text-sm text-primary">{journal.createdBy?.name || "-"}</p>
                <p className="text-xs text-muted">{formatDate(journal.createdAt, "dd MMM yyyy HH:mm")}</p>
              </div>
              
              {journal.postedBy && (
                <div>
                  <p className="text-xs text-secondary font-medium uppercase mb-1">Diposting Oleh</p>
                  <p className="text-sm text-primary">{journal.postedBy.name}</p>
                  <p className="text-xs text-muted">
                    {formatDate(journal.postedAt, "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-bold text-primary mb-4">Rincian Transaksi</h3>
          <JournalDetailLines details={journal.details || []} />
        </div>
      </div>

      {/* Void Modal */}
      <Dialog
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Pembatalan Jurnal (Void)"
      >
        <FormWrapper
          schema={voidJournalSchema}
          onSubmit={handleVoid}
          defaultValues={{ reason: "" }}
        >
          <div className="space-y-4 mb-6 mt-2">
            <p className="text-sm text-secondary">
              Membatalkan jurnal berarti jurnal ini tidak akan dihitung lagi dalam laporan keuangan. Histori jurnal akan tetap disimpan dengan status VOID.
            </p>
            
            <FormField
              name="reason"
              label="Alasan Pembatalan"
              type="textarea"
              rows={3}
              placeholder="Jelaskan alasan jurnal ini dibatalkan..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" intent="secondary" onClick={() => setIsVoidModalOpen(false)} disabled={isPending}>
              Tutup
            </Button>
            <Button type="submit" intent="destructive" isLoading={isPending}>
              Void Jurnal
            </Button>
          </div>
        </FormWrapper>
      </Dialog>
    </div>
  );
}
