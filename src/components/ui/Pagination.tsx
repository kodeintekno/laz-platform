"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t border-transparent bg-surface px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-sm">
      <div className="flex flex-1 justify-between sm:hidden">
        <Link
          href={getPageUrl(Math.max(1, currentPage - 1))}
          className={`relative inline-flex items-center rounded-xl border border-transparent bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-muted ${
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }`}
        >
          Previous
        </Link>
        <Link
          href={getPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`relative ml-3 inline-flex items-center rounded-xl border border-transparent bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-muted ${
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }`}
        >
          Next
        </Link>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-secondary">
            Menampilkan halaman <span className="font-semibold">{currentPage}</span> dari{" "}
            <span className="font-semibold">{totalPages}</span> ({totalCount} total)
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-transparent bg-background overflow-hidden"
            aria-label="Pagination"
          >
            <Link
              href={getPageUrl(Math.max(1, currentPage - 1))}
              className={`relative inline-flex items-center px-3 py-2 text-secondary hover:bg-surface-muted ${
                currentPage === 1 ? "pointer-events-none opacity-30" : ""
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </Link>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <Link
                  key={pageNum}
                  href={getPageUrl(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                     isActive
                       ? "bg-primary text-primary"
                       : "text-primary hover:bg-surface-muted border-l border-transparent"
                   }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            <Link
              href={getPageUrl(Math.min(totalPages, currentPage + 1))}
              className={`relative inline-flex items-center px-3 py-2 text-secondary hover:bg-surface-muted border-l border-transparent ${
                currentPage === totalPages ? "pointer-events-none opacity-30" : ""
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
