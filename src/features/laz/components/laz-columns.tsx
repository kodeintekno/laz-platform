"use client";

import React from "react";
import { Badge, ActionDropdown } from "@/components/ui";
import type { ColumnDef } from "@/components/ui/data-table";
import type { Laz } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";

interface GetLazColumnsProps {
  onEdit: (laz: Laz) => void;
  onDelete: (laz: Laz) => void;
}

export function getLazColumns({ onEdit, onDelete }: GetLazColumnsProps): ColumnDef<Laz>[] {
  return [
    {
      header: "Logo",
      cell: (laz) => (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-soft text-secondary font-bold text-sm border border-surface-soft overflow-hidden">
          {laz.logo ? (
            <img src={laz.logo} alt={laz.name} className="w-full h-full object-cover" />
          ) : (
            laz.name.slice(0, 2).toUpperCase()
          )}
        </div>
      ),
    },
    {
      header: "Nama Organisasi",
      accessorKey: "name",
      cell: (laz) => <span className="font-semibold text-primary">{laz.name}</span>,
    },
    {
      header: "Slug",
      accessorKey: "slug",
      cell: (laz) => <span className="text-secondary font-mono text-xs">{laz.slug}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (laz) => (
        <Badge intent={laz.status === "ACTIVE" ? "success" : "destructive"}>
          {laz.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
        </Badge>
      ),
    },
    {
      header: "Tanggal Terdaftar",
      accessorKey: "createdAt",
      cell: (laz) => {
        return new Date(laz.createdAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
    {
      header: "Aksi",
      align: "right",
      cell: (laz) => (
        <ActionDropdown
          items={[
            {
              label: "Ubah",
              icon: Pencil,
              onClick: () => onEdit(laz),
              intent: "info",
            },
            {
              label: "Hapus",
              icon: Trash2,
              onClick: () => onDelete(laz),
              intent: "destructive",
            },
          ]}
        />
      ),
    },
  ];
}
