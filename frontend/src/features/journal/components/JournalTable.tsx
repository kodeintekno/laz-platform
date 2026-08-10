import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Edit, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface JournalTableProps {
  journals: any[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
}

export function JournalTable({ journals, pagination }: JournalTableProps) {
  if (!journals || journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-border rounded-xl">
        <p className="text-secondary">Tidak ada jurnal ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-secondary bg-surface-soft uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">No. Jurnal & Tanggal</th>
                <th className="px-4 py-3 font-semibold">Deskripsi</th>
                <th className="px-4 py-3 font-semibold">Total (Rp)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {journals.map((journal) => {
                // Calculate total from details (sum of debits)
                const total = journal.details?.reduce((sum: number, d: any) => sum + (Number(d.debit) || 0), 0) || 0;

                return (
                  <tr key={journal.id} className="hover:bg-surface-muted/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link 
                          to={`/dashboard/journal/${journal.id}`}
                          className="font-mono font-bold text-primary hover:text-blue-600 transition-colors"
                        >
                          {journal.journalNo}
                        </Link>
                        <span className="text-xs text-secondary">
                          {formatDate(journal.journalDate, "dd MMM yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-primary font-medium line-clamp-2">
                          {journal.description}
                        </span>
                        <div className="flex gap-2 items-center">
                          <Badge intent="muted" className="text-[10px] py-0 px-1.5">{journal.sourceType}</Badge>
                          {journal.createdBy?.name && (
                            <span className="text-[11px] text-muted">oleh {journal.createdBy.name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-primary">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        intent={
                          journal.status === "POSTED" ? "success" :
                          journal.status === "VOID" ? "destructive" : "warning"
                        }
                      >
                        {journal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link to={`/dashboard/journal/${journal.id}`}>
                          <Button intent="secondary" size="sm" className="h-8 px-2">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
