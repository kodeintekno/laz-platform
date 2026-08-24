"use client";

import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

type DonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    program: { select: { title: true } };
    payment: true;
  };
}>;

export function DonationTable({
  donations,
  pagination,
}: {
  donations: DonationWithRelations[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}) {
  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const columns: ColumnDef<DonationWithRelations>[] = [
    {
      header: "Donatur",
      cell: (donation) => (
        <div>
          <div className="font-semibold text-primary">
            {donation.isAnonymous ? "Hamba Allah" : donation.donorName || "Hamba Allah"}
            {donation.isAnonymous && donation.donorName && (
              <span className="ml-2 text-xs text-muted font-normal">
                (Asli: {donation.donorName})
              </span>
            )}
          </div>
          {donation.donorPhone && (
            <div className="text-secondary text-xs mt-0.5">{donation.donorPhone}</div>
          )}
        </div>
      ),
    },
    {
      header: "Program",
      accessorKey: "program.title",
      width: "250px",
    },
    {
      header: "Nominal",
      cell: (donation) => (
        <div>
          <div className="font-semibold text-primary">
            {formatRupiah(donation.amount as any)}
          </div>
          {donation.payment?.paymentMethod && (
            <div className="text-xs text-secondary font-normal mt-0.5">
              {donation.payment.paymentMethod.replace(/_/g, " ")}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (donation) => (
        <Badge
          intent={
            donation.status === "PAID"
              ? "success"
              : donation.status === "PENDING"
              ? "warning"
              : "destructive"
          }
        >
          {donation.status}
        </Badge>
      ),
    },
    {
      header: "Tanggal",
      cell: (donation) => formatDate(donation.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={donations}
      pagination={pagination}
      emptyTitle="Tidak ada data donasi ditemukan"
      emptyDescription="Belum ada transaksi donasi yang tercatat di platform."
    />
  );
}
