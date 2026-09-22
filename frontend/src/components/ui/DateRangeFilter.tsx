// src/components/ui/DateRangeFilter.tsx
"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
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
export function DateRangeFilter({ startDate, endDate }: DateRangeFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    // Update the changed field
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    setSearchParams(params);
  };

  return (
    <div className="flex space-x-2 items-center">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <Input
          type="date"
          name="startDate"
          value={startDate || ""}
          onChange={handleChange}
          className="w-32"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <Input
          type="date"
          name="endDate"
          value={endDate || ""}
          onChange={handleChange}
          className="w-32"
        />
      </div>
    </div>
  );
}
