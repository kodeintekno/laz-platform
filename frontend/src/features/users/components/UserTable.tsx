"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/stores/toast.store";
import { deleteUserAction } from "../actions/users.actions";
import { getUserColumns, type UserWithRoleAndLembaga } from "./user-columns";
import { logger } from "@/lib/logger";

interface UserTableProps {
  users: UserWithRoleAndLembaga[];
  roles: { id: string; name: string }[];
  isSuperAdmin: boolean;
  currentUserId: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export function UserTable({
  users,
  roles,
  isSuperAdmin,
  currentUserId,
  pagination,
}: UserTableProps) {
  logger.debug({ usersCount: users.length, pagination }, "UserTable render props");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    user: UserWithRoleAndLembaga | null;
  }>({
    isOpen: false,
    user: null,
  });

  const handleEdit = (user: UserWithRoleAndLembaga) => {
    router.push(`/dashboard/users/${user.id}/edit`);
  };

  const handleDelete = (user: UserWithRoleAndLembaga) => {
    logger.info({ userId: user.id }, "Delete request initiated for User");
    setConfirmState({
      isOpen: true,
      user,
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmState.user) return;
    const userId = confirmState.user.id;
    const userName = confirmState.user.name || confirmState.user.email;

    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Berhasil menghapus pengguna "${userName}"`);
        router.refresh();
      }
      setConfirmState({ isOpen: false, user: null });
    });
  };

  const columns = getUserColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    showLembagaColumn: isSuperAdmin,
    currentUserId,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        pagination={pagination}
        emptyTitle="Tidak ada data pengguna ditemukan"
        emptyDescription="Daftar pengguna kosong atau tidak ada data yang sesuai."
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${confirmState.user?.name || confirmState.user?.email}"? Tindakan ini tidak dapat dikembalikan.`}
        confirmText="Hapus"
        cancelText="Batal"
        intent="destructive"
        isLoading={isPending}
      />
    </>
  );
}
