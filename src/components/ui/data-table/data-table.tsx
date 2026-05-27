"use client";

import React from "react";
import { DataTableHeader } from "./data-table-header";
import { DataTableBody } from "./data-table-body";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableEmpty } from "./data-table-empty";
import type { ColumnDef } from "./index";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean;

  // Sorting
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortKey: string, sortOrder: "asc" | "desc") => void;

  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };

  // Selection
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  getRowId?: (item: TData) => string;

  // Toolbar / Filtering
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  
  // Empty State Override
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  sortKey,
  sortOrder,
  onSortChange,
  pagination,
  selectedRowIds,
  onSelectedRowIdsChange,
  getRowId,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterSlot,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData>) {
  
  const enableSelection = !!selectedRowIds && !!onSelectedRowIdsChange && !!getRowId;
  
  // Check if all visible records are selected
  const isAllSelected = React.useMemo(() => {
    if (!enableSelection || data.length === 0 || !getRowId) return false;
    return data.every((item) => selectedRowIds.includes(getRowId(item)));
  }, [enableSelection, data, selectedRowIds, getRowId]);

  const handleSelectAllToggle = () => {
    if (!enableSelection || !getRowId || !onSelectedRowIdsChange || !selectedRowIds) return;
    
    const visibleIds = data.map((item) => getRowId(item));
    if (isAllSelected) {
      // Unselect all visible rows
      onSelectedRowIdsChange(selectedRowIds.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible rows
      const nextIds = Array.from(new Set([...selectedRowIds, ...visibleIds]));
      onSelectedRowIdsChange(nextIds);
    }
  };

  const handleRowSelectToggle = (id: string) => {
    if (!enableSelection || !onSelectedRowIdsChange || !selectedRowIds) return;
    
    if (selectedRowIds.includes(id)) {
      onSelectedRowIdsChange(selectedRowIds.filter((x) => x !== id));
    } else {
      onSelectedRowIdsChange([...selectedRowIds, id]);
    }
  };

  const showEmpty = !loading && data.length === 0;

  return (
    <div className="space-y-4 w-full">
      {/* Toolbar (Search Input & Filters Slot) */}
      {(onSearchChange || searchValue || filterSlot) && (
        <DataTableToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filterSlot={filterSlot}
        />
      )}

      {/* Main Table Wrapper */}
      <div className="overflow-hidden rounded-xl bg-surface shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-border align-middle">
            <DataTableHeader
              columns={columns}
              enableSelection={enableSelection}
              isAllSelected={isAllSelected}
              onSelectAllToggle={handleSelectAllToggle}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            
            {!showEmpty ? (
              <DataTableBody
                columns={columns}
                data={data}
                loading={loading}
                enableSelection={enableSelection}
                selectedRowIds={selectedRowIds}
                onRowSelectToggle={handleRowSelectToggle}
                getRowId={getRowId}
              />
            ) : (
              <tbody>
                <DataTableEmpty
                  title={emptyTitle}
                  description={emptyDescription}
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                />
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <DataTablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
        />
      )}
    </div>
  );
}
