"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { Laz } from "@prisma/client";

interface LazTableProps {
  lazs: Laz[];
}

export function LazTable({ lazs }: LazTableProps) {
  const columns: ColumnDef<Laz>[] = [
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
  ];

  return (
    <DataTable
      columns={columns}
      data={lazs}
      emptyTitle="Tidak ada data LAZ ditemukan"
      emptyDescription="Daftar organisasi LAZ kosong atau tidak ada data yang sesuai."
    />
  );
}
