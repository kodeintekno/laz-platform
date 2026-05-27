"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = formData.get("search")?.toString() || "";

    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (searchVal) {
      params.set("search", searchVal);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset page when query changes
    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="flex items-center gap-2 max-w-md w-full">
        <Input
          name="search"
          defaultValue={searchValue || ""}
          placeholder={searchPlaceholder}
          className="w-full"
        />
        <Button type="submit">Cari</Button>
        {searchValue && (
          <Button type="button" intent="outline" onClick={handleReset}>
            Reset
          </Button>
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
