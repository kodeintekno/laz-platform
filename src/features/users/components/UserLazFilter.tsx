"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui";

interface UserLazFilterProps {
  lazs: { id: string; name: string }[];
}

export function UserLazFilter({ lazs }: UserLazFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectedLazId = searchParams?.get("lazId") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    
    if (val) {
      params.set("lazId", val);
    } else {
      params.delete("lazId");
    }
    params.set("page", "1"); // Reset to page 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="w-full sm:w-64">
      <Select
        value={selectedLazId}
        onChange={handleChange}
        disabled={isPending}
        className="h-10 text-sm py-1.5"
      >
        <option value="">Semua Lembaga Zakat (LAZ)</option>
        {lazs.map((laz) => (
          <option key={laz.id} value={laz.id}>
            {laz.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
