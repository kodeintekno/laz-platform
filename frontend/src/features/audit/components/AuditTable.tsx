"use client";

import type { AuditLogRecord } from "../types/audit.types";
import { DataTable } from "@/components/ui/data-table";

interface AuditTableProps {
  logs: AuditLogRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

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
