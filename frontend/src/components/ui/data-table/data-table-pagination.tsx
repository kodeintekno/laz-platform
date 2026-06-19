import React from "react";
import { Pagination } from "@/components/ui/Pagination";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: DataTablePaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      pageSize={pageSize}
    />
  );
}
