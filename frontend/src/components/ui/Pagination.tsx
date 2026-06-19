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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      const leftBound = Math.max(2, currentPage - 1);
      const rightBound = Math.min(totalPages - 1, currentPage + 1);
      
      if (leftBound > 2) {
        pages.push("ellipsis-prev");
      }
      
      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }
      
      if (rightBound < totalPages - 1) {
        pages.push("ellipsis-next");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  // Generate unique ID for label semantic association
  const selectId = "pagination-limit-select";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 sm:px-6 mt-4 rounded-xl border border-border/20 bg-surface/90 shadow-sm w-full">
      {/* Left side: text indicator & row selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-secondary font-medium">
        <div>
          Menampilkan <span className="text-primary font-semibold">{start === end ? `${start}` : `${start}-${end}`}</span> dari{" "}
          <span className="text-primary font-semibold">{totalCount}</span> data
        </div>
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4">
          <label htmlFor={selectId} className="text-secondary/80">Tampilkan:</label>
          <select
            id={selectId}
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
      <nav className="flex items-center gap-1.5" aria-label="Paginasi Halaman">
        {/* Previous page button */}
        <Link
          href={getPageUrl(Math.max(1, currentPage - 1))}
          className={`h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl border border-border/30 bg-surface text-secondary transition-all duration-200 hover:bg-surface-soft hover:text-primary hover:border-primary/20 active:scale-95 ${
            currentPage === 1 ? "pointer-events-none opacity-30 bg-surface-muted border-transparent" : "cursor-pointer"
          }`}
          aria-label="Halaman sebelumnya"
        >
          <span className="sr-only">Sebelumnya</span>
          <ChevronLeft className="h-4.5 w-4.5" />
        </Link>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => {
          if (typeof page === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center text-secondary text-xs select-none"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={`h-11 min-w-11 sm:h-9 sm:min-w-9 px-2 flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/10 scale-105 border border-transparent"
                  : "text-secondary hover:bg-surface-soft hover:text-primary border border-transparent"
              }`}
              aria-label={`Halaman ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </Link>
          );
        })}

        {/* Next page button */}
        <Link
          href={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl border border-border/30 bg-surface text-secondary transition-all duration-200 hover:bg-surface-soft hover:text-primary hover:border-primary/20 active:scale-95 ${
            currentPage === totalPages ? "pointer-events-none opacity-30 bg-surface-muted border-transparent" : "cursor-pointer"
          }`}
          aria-label="Halaman berikutnya"
        >
          <span className="sr-only">Berikutnya</span>
          <ChevronRight className="h-4.5 w-4.5" />
        </Link>
      </nav>
    </div>
  );
}
