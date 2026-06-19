"use client";

import React from "react";
import { Badge, ActionDropdown } from "@/components/ui";
import type { ColumnDef } from "@/components/ui/data-table";
import type { Prisma } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";

export type UserWithRoleAndLaz = Prisma.UserGetPayload<{
  include: {
    role: { select: { id: true; name: true } };
    laz: { select: { id: true; name: true } };
  };
}>;

interface GetUserColumnsProps {
  onEdit: (user: UserWithRoleAndLaz) => void;
  onDelete: (user: UserWithRoleAndLaz) => void;
  showLazColumn: boolean;
  currentUserId: string;
}

export function getUserColumns({
  onEdit,
  onDelete,
  showLazColumn,
  currentUserId,
}: GetUserColumnsProps): ColumnDef<UserWithRoleAndLaz>[] {
  const columns: ColumnDef<UserWithRoleAndLaz>[] = [
    {
      header: "Nama",
      accessorKey: "name",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-soft text-brand-primary font-bold text-xs shadow-sm flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              (user.name || user.email).slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-primary">{user.name || "N/A"}</span>
            {user.id === currentUserId && (
              <span className="inline-flex items-center text-[10px] text-brand-primary font-semibold mt-0.5">
                (Akun Anda)
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (user) => <span className="text-secondary">{user.email}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (user) => {
        let intent: "success" | "warning" | "destructive" | "muted" = "muted";
        let label = "Tidak Aktif";

        if (user.status === "ACTIVE") {
          intent = "success";
          label = "Aktif";
        } else if (user.status === "SUSPENDED") {
          intent = "destructive";
          label = "Ditangguhkan";
        }

        return <Badge intent={intent}>{label}</Badge>;
      },
    },
    {
      header: "Role / Peran",
      accessorKey: "role.name",
      cell: (user) => {
        const roleName = user.role?.name || "N/A";
        let intent: "success" | "warning" | "destructive" | "info" | "muted" = "muted";
        let label = roleName;

        const normalized = roleName.toUpperCase().replace(/\s+/g, "_");
        if (normalized === "SUPER_ADMIN") {
          intent = "destructive";
          label = "Super Admin";
        } else if (normalized === "ADMIN") {
          intent = "info";
          label = "Admin";
        } else if (normalized === "FINANCE") {
          intent = "warning";
          label = "Finance";
        } else if (normalized === "RELAWAN") {
          intent = "success";
          label = "Relawan";
        } else if (normalized === "DONATUR") {
          intent = "muted";
          label = "Donatur";
        }

        return (
          <Badge intent={intent}>
            {label}
          </Badge>
        );
      },
    },
  ];

  if (showLazColumn) {
    columns.push({
      header: "Lembaga Zakat (LAZ)",
      accessorKey: "laz.name",
      cell: (user) => <span className="text-secondary text-sm">{user.laz?.name || "N/A"}</span>,
    });
  }

  columns.push({
    header: "Aksi",
    align: "right",
    cell: (user) => {
      const isSelf = user.id === currentUserId;
      
      const items: {
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        onClick: () => void | Promise<void>;
        intent?: "info" | "destructive" | "default";
      }[] = [
        {
          label: "Ubah",
          icon: Pencil,
          onClick: () => onEdit(user),
          intent: "info",
        },
      ];

      // Prevent self-deletion option in the dropdown visually
      if (!isSelf) {
        items.push({
          label: "Hapus",
          icon: Trash2,
          onClick: () => onDelete(user),
          intent: "destructive",
        });
      }

      return (
        <ActionDropdown items={items} />
      );
    },
  });

  return columns;
}
