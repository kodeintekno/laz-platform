"use client";

import { useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Laz } from "@prisma/client";
import { useRouter } from "next/navigation";
import { getLazColumns } from "./laz-columns";
import { logger } from "@/lib/logger";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/stores/toast.store";
import { deleteLazAction } from "../actions/laz.actions";

interface LazTableProps {
  lazs: Laz[];
  search?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export function LazTable({ lazs, search, pagination }: LazTableProps) {
  logger.debug({ lazsCount: lazs.length, search, pagination }, "LazTable render props");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    laz: Laz | null;
  }>({
    isOpen: false,
    laz: null,
  });

  const handleDelete = (laz: Laz) => {
    logger.info({ lazId: laz.id }, "Delete request initiated for LAZ");
    setConfirmState({
      isOpen: true,
      laz,
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmState.laz) return;
    const lazId = confirmState.laz.id;
    const lazName = confirmState.laz.name;

    startTransition(async () => {
      const result = await deleteLazAction(lazId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Berhasil menghapus data LAZ "${lazName}"`);
        router.refresh();
      }
      setConfirmState({ isOpen: false, laz: null });
    });
  };

  const handleEdit = (laz: Laz) => {
    router.push(`/dashboard/laz/${laz.id}/edit`);
  };

  const columns = getLazColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={lazs}
        pagination={pagination}
        emptyTitle="Tidak ada data LAZ ditemukan"
        emptyDescription="Daftar organisasi LAZ kosong atau tidak ada data yang sesuai."
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, laz: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus LAZ"
        message={`Apakah Anda yakin ingin menghapus lembaga amil zakat "${confirmState.laz?.name}"? Seluruh data yang terhubung dengan tenant ini akan ikut terhapus dan tidak dapat dikembalikan.`}
        confirmText="Hapus"
        cancelText="Batal"
        intent="destructive"
        isLoading={isPending}
      />
    </>
  );
}
