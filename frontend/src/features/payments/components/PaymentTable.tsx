"use client";

import React from "react";
import { Badge, Button, Dialog } from "@/components/ui";
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
  const [selectedPayment, setSelectedPayment] = React.useState<any | null>(null);

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
    {
      header: "Aksi",
      cell: (payment) => (
        <Button 
          size="sm" 
          intent="outline" 
          onClick={() => setSelectedPayment(payment)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={payments}
        pagination={pagination}
        emptyTitle="Tidak ada transaksi pembayaran"
        emptyDescription="Daftar pembayaran kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
      />
      
      <Dialog 
        isOpen={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)}
        title="Detail Pembayaran"
      >
        {selectedPayment && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-secondary font-medium">Invoice / Ref</p>
                <p className="font-bold text-primary">{selectedPayment.gatewayRef || selectedPayment.id}</p>
              </div>
              <div>
                <p className="text-secondary font-medium">Tanggal Dibuat</p>
                <p className="font-medium text-primary">{formatDate(selectedPayment.createdAt)}</p>
              </div>
              <div>
                <p className="text-secondary font-medium">Nominal</p>
                <p className="font-bold text-primary">{formatRupiah(selectedPayment.amount)}</p>
              </div>
              <div>
                <p className="text-secondary font-medium">Status</p>
                <Badge intent={getStatusIntent(selectedPayment.status)}>
                  {selectedPayment.status}
                </Badge>
              </div>
              <div>
                <p className="text-secondary font-medium">Metode Pembayaran</p>
                <p className="font-medium text-primary">
                  {selectedPayment.paymentMethod ? selectedPayment.paymentMethod.replace("_", " ") : "-"}
                </p>
              </div>
              <div>
                <p className="text-secondary font-medium">Channel / Provider</p>
                <p className="font-medium text-primary">
                  {selectedPayment.channelCode || "-"}
                </p>
              </div>
            </div>
            
            <div className="border-t border-border/40 pt-4 mt-4">
              <h4 className="font-bold text-primary mb-2">Informasi Donatur</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-secondary font-medium">Nama Donatur</p>
                  <p className="font-medium text-primary">
                    {selectedPayment.donation?.donorName || "Hamba Allah"}
                    {selectedPayment.donation?.isAnonymous && <span className="ml-1 text-xs text-muted">(Anonim)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-secondary font-medium">Telepon / Email</p>
                  <p className="font-medium text-primary">
                    {selectedPayment.donation?.donorPhone || "-"} / {selectedPayment.donation?.donorEmail || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 mt-4">
              <h4 className="font-bold text-primary mb-2">Informasi Program & Lembaga</h4>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-secondary font-medium">Program</p>
                  <p className="font-medium text-primary">{selectedPayment.donation?.program?.title}</p>
                </div>
                <div>
                  <p className="text-secondary font-medium">Lembaga Penyalur</p>
                  <p className="font-medium text-primary">
                    {selectedPayment.donation?.lembaga?.name || selectedPayment.donation?.program?.lembaga?.name || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
