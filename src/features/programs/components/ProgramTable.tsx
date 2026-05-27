"use client";

import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

type ProgramWithCreator = Prisma.ProgramGetPayload<{
  include: { createdBy: { select: { name: true } } };
}>;

export function ProgramTable({ programs }: { programs: ProgramWithCreator[] }) {
  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
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
      cell: (program) => (
        <Badge intent="info">
          {program.category}
        </Badge>
      ),
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
      cell: (program) => (
        <Badge
          intent={
            program.status === "PUBLISHED"
              ? "success"
              : program.status === "COMPLETED"
              ? "muted"
              : "warning"
          }
        >
          {program.status}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (program) => (
        <div className="space-x-4">
          <Link
            href={`/programs/${program.slug}`}
            className="text-brand-primary hover:text-brand-secondary font-semibold text-sm"
          >
            Lihat
          </Link>
          <Link
            href={`/dashboard/programs/${program.slug}/distributions/new`}
            className="text-brand-accent hover:text-brand-secondary font-semibold text-sm"
          >
            Ajukan Penyaluran
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={programs}
      emptyTitle="Tidak ada program ditemukan"
      emptyDescription="Daftar program kampanye zakat, infak, atau sedekah kosong."
    />
  );
}
