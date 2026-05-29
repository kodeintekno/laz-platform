// src/components/ui/DateRangeFilter.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
}

/**
 * Reusable date range filter used in the Audit Logs toolbar.
 * It auto‑submits on change by updating the URL query parameters.
 */
export function DateRangeFilter({ startDate, endDate, search, page }: DateRangeFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page !== undefined) params.set("page", page.toString());
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    // Update the changed field
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <form className="flex space-x-2 items-center">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <Input
          type="date"
          name="startDate"
          defaultValue={startDate}
          onChange={handleChange}
          className="w-32"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <Input
          type="date"
          name="endDate"
          defaultValue={endDate}
          onChange={handleChange}
          className="w-32"
        />
      </div>
    </form>
  );
}
