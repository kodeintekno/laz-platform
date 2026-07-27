"use client";

import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

type DistributionWithRelations = Prisma.DistributionGetPayload<{
  include: {
    program: { select: { title: true; currentAmount: true; distributedAmount: true } };
    createdBy: { select: { name: true; email: true } };
    approvedBy: { select: { name: true } };
  };
}>;

export function DistributionTable({
  distributions,
  pagination
}: {
  distributions: DistributionWithRelations[],
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  }
}) {
  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const columns: ColumnDef<DistributionWithRelations>[] = [
    {
      header: "Program",
      cell: (dist) => (
        <div>
          <div className="font-semibold text-primary truncate max-w-[200px]">{dist.program.title}</div>
          <div className="text-xs text-secondary mt-0.5">
            Saldo: {formatRupiah(Number(dist.program.currentAmount) - Number(dist.program.distributedAmount))}
          </div>
        </div>
      ),
    },
    {
      header: "Rincian Penyaluran",
      cell: (dist) => (
        <div className="max-w-[250px]">
          <div className="font-medium text-primary mb-1">{dist.title}</div>
          <div className="text-xs text-secondary line-clamp-2">{dist.description}</div>
        </div>
      ),
    },
    {
      header: "Nominal",
      cell: (dist) => (
        <span className="font-medium text-primary">{formatRupiah(dist.amount as any)}</span>
      ),
    },
    {
      header: "Dicatat Oleh",
      cell: (dist) => (
        <span className="text-secondary text-sm">{dist.createdBy.name}</span>
      ),
    },
    {
      header: "Status",
      cell: () => <Badge intent="success">Selesai</Badge>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={distributions}
      pagination={pagination}
      emptyTitle="Tidak ada data penyaluran ditemukan"
      emptyDescription="Daftar pencatatan penyaluran dana kosong."
    />
  );
}
