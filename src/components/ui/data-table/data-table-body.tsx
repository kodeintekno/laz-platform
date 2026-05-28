"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { DataTableCell } from "./data-table-cell";
import type { ColumnDef } from "./index";

interface DataTableBodyProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
  
  // Selection
  enableSelection?: boolean;
  selectedRowIds?: string[];
  onRowSelectToggle?: (id: string) => void;
  getRowId?: (item: TData) => string;
}

function getRowValue(obj: any, path: string) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export function DataTableBody<TData>({
  columns,
  data,
  loading = false,
  enableSelection = false,
  selectedRowIds = [],
  onRowSelectToggle,
  getRowId,
}: DataTableBodyProps<TData>) {
  const totalCols = columns.length + (enableSelection ? 1 : 0);

  if (loading) {
    return (
      <tbody className="divide-y divide-border/40 bg-surface">
        {Array.from({ length: 5 }).map((_, rIdx) => (
          <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
            {Array.from({ length: totalCols }).map((_, cIdx) => (
              <td key={`skeleton-cell-${cIdx}`} className="px-3 py-4 whitespace-nowrap">
                <Skeleton className="h-4 w-full max-w-[120px] rounded-xl bg-surface-soft" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border/40 bg-surface">
      {data.map((item, rIdx) => {
        const id = getRowId ? getRowId(item) : (item as any).id || rIdx.toString();
        const isSelected = selectedRowIds.includes(id);

        return (
          <tr
            key={id}
            className={`hover:bg-surface-muted transition duration-150 ${
              isSelected ? "bg-primary/5" : ""
            }`}
          >
            {/* Selection Checkbox */}
            {enableSelection && (
              <td className="w-12 px-4 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onRowSelectToggle && onRowSelectToggle(id)}
                  className="h-4 w-4 rounded-xl shadow-sm text-primary focus:ring-primary cursor-pointer"
                />
              </td>
            )}

            {/* Value Cells */}
            {columns.map((column, cIdx) => {
              const cellValue = column.cell
                ? column.cell(item)
                : getRowValue(item, column.accessorKey || "");

              return (
                <DataTableCell
                  key={column.accessorKey || cIdx.toString()}
                  align={column.align}
                  width={column.width}
                >
                  {cellValue !== undefined && cellValue !== null ? cellValue : "-"}
                </DataTableCell>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
