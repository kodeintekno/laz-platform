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
        <span className="font-mono text-primary select-all font-medium">
          {payment.gatewayRef || payment.id}
        </span>
      ),
    },
    {
      header: "Program",
      cell: (payment) => (
        <div className="max-w-[200px] truncate font-medium text-primary" title={payment.donation.program.title}>
          {payment.donation.program.title}
        </div>
      ),
    },
    {
      header: "Donatur",
      cell: (payment) => (
        <div>
          <div className="font-semibold text-primary">
            {payment.donation.isAnonymous ? "Hamba Allah" : payment.donation.donorName || "Hamba Allah"}
            {payment.donation.isAnonymous && payment.donation.donorName && (
              <span className="ml-2 text-xs text-muted font-normal">(Asli: {payment.donation.donorName})</span>
            )}
          </div>
          {payment.donation.donorPhone && (
            <div className="text-xs text-muted mt-0.5">{payment.donation.donorPhone}</div>
          )}
        </div>
      ),
    },
    {
      header: "Nominal",
      cell: (payment) => (
        <span className="font-semibold text-primary">{formatRupiah(payment.amount)}</span>
      ),
    },
    {
      header: "Metode",
      cell: (payment) => (
        <span className="font-medium text-secondary">
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
        <span className="text-secondary text-sm">
          {formatDate(payment.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      pagination={pagination}
      emptyTitle="Tidak ada transaksi pembayaran"
      emptyDescription="Daftar pembayaran kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
    />
  );
}
