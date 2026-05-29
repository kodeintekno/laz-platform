"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { logger } from "@/lib/logger";
import { useDebouncedCallback } from "use-debounce";
import { X } from "lucide-react";

interface DataTableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
}

export function DataTableToolbar({
  searchValue,
  searchPlaceholder = "Cari...",
  filterSlot,
}: DataTableToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [inputVal, setInputVal] = useState(searchValue || "");
  const [isPending, startTransition] = useTransition();

  // Track values pushed by this component to avoid overwriting input value on transition resolution
  const pushedValuesRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop value with local input state only when it changes externally (e.g. browser navigation)
  useEffect(() => {
    const normalizedSearch = searchValue || "";
    if (pushedValuesRef.current.has(normalizedSearch)) {
      pushedValuesRef.current.delete(normalizedSearch);
    } else {
      setInputVal(normalizedSearch);
    }
  }, [searchValue]);

  // Helper to update URL search params and track the push
  const pushSearch = (val: string) => {
    const normalized = val.trim();
    pushedValuesRef.current.add(normalized);

    logger.info({ search: normalized }, "Executing search routing");
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (normalized) {
      params.set("search", normalized);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset page when query changes

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounced URL updates
  const debouncedPush = useDebouncedCallback((val: string) => {
    if (val.trim() === (searchValue || "")) return;
    pushSearch(val);
  }, 400);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    debouncedPush(val);
  };

  const handleClear = () => {
    setInputVal("");
    debouncedPush.cancel();
    pushSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    debouncedPush.cancel();
    pushSearch(inputVal);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full rounded-2xl border border-border/20 bg-surface p-4 shadow-soft"
    >
      <div className="relative max-w-md w-full">
        <Input
          ref={inputRef}
          name="search"
          value={inputVal}
          onChange={handleChange}
          placeholder={searchPlaceholder}
          className="w-full pr-10"
        />
        {inputVal && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary hover:text-primary transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dynamic Filter Selectors Slot */}
      {filterSlot && (
        <div className="flex flex-wrap items-center gap-2">
          {filterSlot}
        </div>
      )}
    </form>
  );
}

export function DataTableToolbarSkeleton({ showFilter = false }: { showFilter?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full rounded-2xl border border-border/20 bg-surface p-4 shadow-soft animate-pulse">
      <div className="relative max-w-md w-full">
        <div className="h-[46px] w-full bg-surface-soft rounded-lg border border-border/20" />
      </div>
      {showFilter && (
        <div className="w-full sm:w-64 h-[46px] bg-surface-soft rounded-lg border border-border/20" />
      )}
    </div>
  );
}
