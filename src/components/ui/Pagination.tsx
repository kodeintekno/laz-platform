"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  baseUrl?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("limit", newSize.toString());
    params.set("page", "1"); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 sm:px-6 mt-4 rounded-xl border border-border/20 bg-surface/90 shadow-sm w-full">
      {/* Left side: text indicator & row selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-secondary font-medium">
        <div>
          Menampilkan <span className="text-primary font-semibold">{start === end ? `${start}` : `${start}-${end}`}</span> dari{" "}
          <span className="text-primary font-semibold">{totalCount}</span> data
        </div>
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-secondary/80">Tampilkan:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-surface border border-border/30 hover:border-primary/20 rounded-lg px-2 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer transition-colors"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} baris
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side navigation buttons */}
      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        {/* Previous page button */}
        <Link
          href={getPageUrl(Math.max(1, currentPage - 1))}
          className={`h-9 w-9 flex items-center justify-center rounded-xl border border-border/30 bg-surface text-secondary transition-all duration-200 hover:bg-surface-soft hover:text-primary hover:border-primary/20 active:scale-95 ${
            currentPage === 1 ? "pointer-events-none opacity-30 bg-surface-muted border-transparent" : "cursor-pointer"
          }`}
        >
          <span className="sr-only">Sebelumnya</span>
          <ChevronLeft className="h-4.5 w-4.5" />
        </Link>

        {/* Page numbers */}
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          const isActive = pageNum === currentPage;
          return (
            <Link
              key={pageNum}
              href={getPageUrl(pageNum)}
              className={`h-9 min-w-9 px-2 flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/10 scale-105 border border-transparent"
                  : "text-secondary hover:bg-surface-soft hover:text-primary border border-transparent"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}

        {/* Next page button */}
        <Link
          href={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`h-9 w-9 flex items-center justify-center rounded-xl border border-border/30 bg-surface text-secondary transition-all duration-200 hover:bg-surface-soft hover:text-primary hover:border-primary/20 active:scale-95 ${
            currentPage === totalPages ? "pointer-events-none opacity-30 bg-surface-muted border-transparent" : "cursor-pointer"
          }`}
        >
          <span className="sr-only">Berikutnya</span>
          <ChevronRight className="h-4.5 w-4.5" />
        </Link>
      </nav>
    </div>
  );
}
