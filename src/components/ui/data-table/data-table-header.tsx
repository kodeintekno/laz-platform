"use client";

import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "./index";

interface DataTableHeaderProps<TData> {
  columns: ColumnDef<TData>[];
  
  // Selection
  enableSelection?: boolean;
  isAllSelected?: boolean;
  onSelectAllToggle?: () => void;
  
  // Sorting
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortKey: string, sortOrder: "asc" | "desc") => void;
}

export function DataTableHeader<TData>({
  columns,
  enableSelection = false,
  isAllSelected = false,
  onSelectAllToggle,
  sortKey,
  sortOrder,
  onSortChange,
}: DataTableHeaderProps<TData>) {
  
  const handleSortClick = (column: ColumnDef<TData>) => {
    if (!column.sortable || !onSortChange) return;
    
    const key = column.sortKey || column.accessorKey;
    if (!key) return;

    let nextOrder: "asc" | "desc" = "asc";
    if (sortKey === key) {
      nextOrder = sortOrder === "asc" ? "desc" : "asc";
    }
    
    onSortChange(key, nextOrder);
  };

  return (
    <thead className="bg-surface-soft">
      <tr>
        {/* Bulk Selection Column */}
        {enableSelection && (
          <th scope="col" className="w-12 px-4 py-3 text-left">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAllToggle}
              className="h-4 w-4 rounded-xl shadow-sm text-primary focus:ring-primary cursor-pointer"
            />
          </th>
        )}

        {/* Regular Columns Headers */}
        {columns.map((column, idx) => {
          const colKey = column.sortKey || column.accessorKey || idx.toString();
          const isSorted = sortKey && (column.sortKey === sortKey || column.accessorKey === sortKey);
          
          const alignClass = {
            left: "text-left",
            center: "text-center",
            right: "text-right",
          }[column.align || "left"];

          return (
            <th
              key={colKey.toString()}
              scope="col"
              className={`px-3 py-3.5 text-sm font-semibold text-primary ${alignClass}`}
              style={column.width ? { width: column.width } : undefined}
            >
              {column.sortable && onSortChange ? (
                <button
                  type="button"
                  onClick={() => handleSortClick(column)}
                  className="inline-flex items-center gap-1 group hover:text-primary focus:outline-none cursor-pointer"
                >
                  <span>{column.header}</span>
                  <span className="flex-shrink-0 text-muted group-hover:text-secondary transition duration-150">
                    {isSorted ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </span>
                </button>
              ) : (
                <span>{column.header}</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
