"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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
  return (
    <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="flex items-center gap-2 max-w-md w-full">
        <Input
          name="search"
          defaultValue={searchValue || ""}
          placeholder={searchPlaceholder}
          className="w-full bg-white"
        />
        <Button type="submit">Cari</Button>
        {searchValue && (
          <Link href="?">
            <Button type="button" intent="outline">Reset</Button>
          </Link>
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
