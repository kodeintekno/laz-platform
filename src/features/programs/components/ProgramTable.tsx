"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Badge, ActionDropdown } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Eye, HandCoins, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/stores/toast.store";
import { deleteProgramAction } from "../actions/programs.actions";

type ProgramWithCreator = Omit<Prisma.ProgramGetPayload<{
  include: { createdBy: { select: { name: true } } };
}>, "targetAmount" | "currentAmount" | "distributedAmount"> & {
  targetAmount: number;
  currentAmount: number;
  distributedAmount: number;
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
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    program: ProgramWithCreator | null;
  }>({
    isOpen: false,
    program: null,
  });
  
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

  const columns: ColumnDef<ProgramWithCreator>[] = [
    {
      header: "Judul Program",
      cell: (program) => (
        <div>
          <div className="font-semibold text-primary truncate max-w-[250px]">{program.title}</div>
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
        let intent: "success" | "warning" | "destructive" | "info" | "muted" = "muted";
        switch (program.status) {
          case "PUBLISHED":
            intent = "success";
            break;
          case "DRAFT":
            intent = "muted";
            break;
          case "COMPLETED":
            intent = "info";
            break;
          case "CANCELLED":
            intent = "destructive";
            break;
        }

        return <Badge intent={intent}>{program.status}</Badge>;
      },
    },
    {
      header: "Aksi",
      align: "right",
      cell: (program) => {
        const items = [
          {
            label: "Lihat",
            icon: Eye,
            onClick: () => router.push(`/programs/${program.slug}`),
            intent: "default" as const,
          },
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
    </>
  );
}
