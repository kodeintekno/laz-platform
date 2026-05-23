"use client";

import React from "react";
import { Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

interface PaymentTableProps {
  payments: any[];
  search?: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

function getStatusIntent(status: string): "success" | "warning" | "destructive" | "info" | "muted" {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "EXPIRED":
    default:
      return "muted";
  }
}

const formatRupiah = (amount: number | string) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
};

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export function PaymentTable({ payments, search, pagination }: PaymentTableProps) {
  const columns: ColumnDef<any>[] = [
    {
      header: "Invoice / Ref",
      cell: (payment) => (
        <span className="font-mono text-gray-900 select-all font-medium">
          {payment.gatewayRef || payment.id}
        </span>
      ),
    },
    {
      header: "Program",
      cell: (payment) => (
        <div className="max-w-[200px] truncate font-medium text-gray-900" title={payment.donation.program.title}>
          {payment.donation.program.title}
        </div>
      ),
    },
    {
      header: "Donatur",
      cell: (payment) => (
        <div>
          <div className="font-semibold text-gray-900">
            {payment.donation.isAnonymous ? "Hamba Allah" : payment.donation.user?.name || "Hamba Allah"}
            {payment.donation.isAnonymous && payment.donation.user && (
              <span className="ml-2 text-xs text-gray-400 font-normal">(Asli: {payment.donation.user.name})</span>
            )}
          </div>
          {payment.donation.user?.email && (
            <div className="text-xs text-gray-400 mt-0.5">{payment.donation.user.email}</div>
          )}
        </div>
      ),
    },
    {
      header: "Nominal",
      cell: (payment) => (
        <span className="font-semibold text-gray-900">{formatRupiah(payment.amount)}</span>
      ),
    },
    {
      header: "Metode",
      cell: (payment) => (
        <span className="font-medium text-gray-600">
          {payment.paymentMethod ? payment.paymentMethod.replace("_", " ") : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (payment) => (
        <Badge intent={getStatusIntent(payment.status)}>
          {payment.status}
        </Badge>
      ),
    },
    {
      header: "Tanggal",
      cell: (payment) => (
        <span className="text-gray-500 text-sm">
          {formatDate(payment.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      searchValue={search || ""}
      onSearchChange={() => {}}
      searchPlaceholder="Cari invoice, program, atau donatur..."
      pagination={pagination}
      emptyTitle="Tidak ada transaksi pembayaran"
      emptyDescription="Daftar pembayaran kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
    />
  );
}
