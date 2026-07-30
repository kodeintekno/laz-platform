"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Badge, ActionDropdown } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { CheckCircle2, Eye, HandCoins, Pencil, Star, Trash2, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/stores/toast.store";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@shared/constants/permissions";
import {
  deleteProgramAction,
  approveProgramAction,
  rejectProgramAction,
  setFeaturedProgramAction,
} from "../actions/programs.actions";
import { ProgramApprovalModal } from "./ProgramApprovalModal";

type ProgramWithCreator = Omit<Prisma.ProgramGetPayload<{
  include: { createdBy: { select: { name: true } }; lembaga: { select: { name: true; slug: true } } };
}>, "targetAmount" | "currentAmount" | "distributedAmount"> & {
  targetAmount: number;
  currentAmount: number;
  distributedAmount: number;
};

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" | "info" | "muted" }> = {
  DRAFT: { label: "Draft", intent: "muted" },
  PENDING_REVIEW: { label: "Menunggu Review", intent: "warning" },
  PUBLISHED: { label: "Published", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
  COMPLETED: { label: "Selesai", intent: "info" },
  CANCELLED: { label: "Dibatalkan", intent: "destructive" },
};

interface ProgramTableProps {
  programs: ProgramWithCreator[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export function ProgramTable({ programs, pagination }: ProgramTableProps) {
  const router = useRouter();
  const { can } = usePermission();
  const canApprove = can(PERMISSIONS.PROGRAMS_APPROVE);
  const canFeature = can(PERMISSIONS.PROGRAMS_PUBLISH);
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    program: ProgramWithCreator | null;
  }>({
    isOpen: false,
    program: null,
  });
  const [rejectState, setRejectState] = useState<{ isOpen: boolean; program: ProgramWithCreator | null; reason: string }>({
    isOpen: false,
    program: null,
    reason: "",
  });
  const [detailProgram, setDetailProgram] = useState<ProgramWithCreator | null>(null);

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleDelete = (program: ProgramWithCreator) => {
    setConfirmState({
      isOpen: true,
      program,
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmState.program) return;
    const programId = confirmState.program.id;
    const programTitle = confirmState.program.title;

    startTransition(async () => {
      const result = await deleteProgramAction(programId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Berhasil menghapus program "${programTitle}"`);
        router.refresh();
      }
      setConfirmState({ isOpen: false, program: null });
    });
  };

  const handleApprove = (program: ProgramWithCreator) => {
    startTransition(async () => {
      const result = await approveProgramAction(program.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Program "${program.title}" telah disetujui dan dipublikasikan`);
        router.refresh();
      }
    });
  };

  const handleReject = (program: ProgramWithCreator) => {
    setRejectState({ isOpen: true, program, reason: "" });
  };

  const handleToggleFeatured = (program: ProgramWithCreator) => {
    const nextFeatured = !program.isFeatured;
    startTransition(async () => {
      const result = await setFeaturedProgramAction(program.id, nextFeatured);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          nextFeatured
            ? `Program "${program.title}" dijadikan program utama di halaman depan`
            : `Program "${program.title}" dibatalkan sebagai program utama`,
        );
        router.refresh();
      }
    });
  };

  const handleConfirmReject = () => {
    if (!rejectState.program || !rejectState.reason.trim()) return;
    const { program, reason } = rejectState;
    startTransition(async () => {
      const result = await rejectProgramAction(program.id, reason);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Program "${program.title}" telah ditolak`);
        router.refresh();
      }
      setRejectState({ isOpen: false, program: null, reason: "" });
    });
  };

  const columns: ColumnDef<ProgramWithCreator>[] = [
    {
      header: "Judul Program",
      cell: (program) => (
        <div>
          <div className="flex items-center gap-1.5">
            <div className="font-semibold text-primary truncate max-w-[250px]">{program.title}</div>
            {program.isFeatured && (
              <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500" />
                Utama
              </span>
            )}
          </div>
          <div className="text-secondary text-xs mt-0.5">oleh {program.createdBy.name}</div>
        </div>
      ),
    },
    {
      header: "Kategori",
      cell: (program) => {
        let intent: "success" | "warning" | "destructive" | "info" | "muted" = "info";
        switch (program.category) {
          case "ZAKAT":
            intent = "success";
            break;
          case "INFAK":
            intent = "info";
            break;
          case "SEDEKAH":
            intent = "warning";
            break;
          case "WAKAF":
            intent = "muted";
            break;
        }

        return <Badge intent={intent}>{program.category}</Badge>;
      },
    },
    {
      header: "Terkumpul",
      cell: (program) => (
        <div>
          <div className="font-semibold text-primary">{formatRupiah(program.currentAmount as any)}</div>
          <div className="text-xs text-muted mt-0.5">dari {formatRupiah(program.targetAmount as any)}</div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (program) => {
        const meta = STATUS_META[program.status] ?? { label: program.status, intent: "muted" as const };
        return <Badge intent={meta.intent}>{meta.label}</Badge>;
      },
    },
    {
      header: "Aksi",
      align: "right",
      cell: (program) => {
        const isPendingReview = program.status === "PENDING_REVIEW";
        const items = [
          ...(isPendingReview && canApprove
            ? [{ label: "Lihat Detail & Review", icon: Eye, onClick: () => setDetailProgram(program), intent: "info" as const }]
            : [{ label: "Lihat", icon: Eye, onClick: () => router.push(`/programs/${program.slug}`), intent: "default" as const }]),
          ...(isPendingReview && canApprove
            ? [
                { label: "Setujui", icon: CheckCircle2, onClick: () => handleApprove(program), intent: "success" as const },
                { label: "Tolak", icon: XCircle, onClick: () => handleReject(program), intent: "destructive" as const },
              ]
            : []),
          ...(program.status === "PUBLISHED" && canFeature
            ? [
                {
                  label: program.isFeatured ? "Batal Program Utama" : "Jadikan Program Utama",
                  icon: Star,
                  onClick: () => handleToggleFeatured(program),
                  intent: program.isFeatured ? ("default" as const) : ("success" as const),
                },
              ]
            : []),
          {
            label: "Edit",
            icon: Pencil,
            onClick: () => router.push(`/dashboard/programs/${program.slug}/edit`),
            intent: "info" as const,
          },
          {
            label: "Penyaluran",
            icon: HandCoins,
            onClick: () => router.push(`/dashboard/programs/${program.slug}/distributions/new`),
            intent: "success" as const,
          },
          {
            label: "Hapus",
            icon: Trash2,
            onClick: () => handleDelete(program),
            intent: "destructive" as const,
          },
        ];

        return <ActionDropdown items={items} />;
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={programs}
        pagination={pagination}
        emptyTitle="Tidak ada program ditemukan"
        emptyDescription="Daftar program kampanye zakat, infak, atau sedekah kosong."
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, program: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Program"
        message={`Apakah Anda yakin ingin menghapus program "${confirmState.program?.title}"? Tindakan ini tidak dapat dikembalikan.`}
        confirmText="Hapus"
        cancelText="Batal"
        intent="destructive"
        isLoading={isPending}
      />

      {rejectState.isOpen && rejectState.program && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-xl border border-border/40 p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-primary">Tolak Pengajuan Program</h3>
            <p className="text-sm text-secondary">
              Berikan alasan penolakan untuk "{rejectState.program.title}". Alasan ini akan ditampilkan kepada admin lembaga.
            </p>
            <textarea
              value={rejectState.reason}
              onChange={(e) => setRejectState((s) => ({ ...s, reason: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-border/60 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
              placeholder="Contoh: Deskripsi program kurang jelas / target dana tidak wajar."
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectState({ isOpen: false, program: null, reason: "" })}
                className="px-4 py-2 text-sm font-semibold text-secondary hover:text-primary transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectState.reason.trim() || isPending}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-destructive text-white hover:bg-destructive/90 transition disabled:opacity-50"
              >
                Tolak Program
              </button>
            </div>
          </div>
        </div>
      )}

      {detailProgram && (
        <ProgramApprovalModal
          program={detailProgram}
          onClose={() => setDetailProgram(null)}
          onApprove={() => {
            handleApprove(detailProgram);
            setDetailProgram(null);
          }}
          onReject={() => {
            setDetailProgram(null);
            handleReject(detailProgram);
          }}
        />
      )}
    </>
  );
}
