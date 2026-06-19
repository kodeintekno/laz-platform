"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";

interface AuditTableProps {
  logs: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

function getActionIntent(action: string): "success" | "warning" | "destructive" | "info" | "muted" {
  switch (action) {
    case "CREATE":
      return "success";
    case "UPDATE":
    case "PAYMENT_UPDATE":
    case "DISTRIBUTION_UPDATE":
      return "warning";
    case "DELETE":
    case "ROLE_CHANGE":
      return "destructive";
    case "LOGIN":
      return "info";
    case "LOGOUT":
    default:
      return "muted";
  }
}

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

import { getAuditTableColumns } from "@/features/audit/components/audit-columns";

export function AuditTable({ logs, pagination }: AuditTableProps) {
  const columns = getAuditTableColumns();


  return (
    <DataTable
      columns={columns}
      data={logs}
      pagination={pagination}
      emptyTitle="Tidak ada log audit ditemukan"
      emptyDescription="Riwayat log audit kosong atau tidak ada catatan yang sesuai dengan pencarian Anda."
    />
  );
}
