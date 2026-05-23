import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";

interface DataTableEmptyProps {
  title?: string;
  description?: string;
  colSpan: number;
}

export function DataTableEmpty({
  title = "Tidak ada data ditemukan",
  description = "Catatan kosong atau tidak ada data yang cocok dengan kriteria pencarian Anda.",
  colSpan,
}: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState title={title} description={description} />
      </td>
    </tr>
  );
}
