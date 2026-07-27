import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui";

interface UserLembagaFilterProps {
  lembagas: { id: string; name: string }[];
}

export function UserLembagaFilter({ lembagas }: UserLembagaFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectedLembagaId = searchParams?.get("lembagaId") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");

    if (val) {
      params.set("lembagaId", val);
    } else {
      params.delete("lembagaId");
    }
    params.set("page", "1"); // Reset to page 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="w-full sm:w-64">
      <Select
        value={selectedLembagaId}
        onChange={handleChange}
        disabled={isPending}
        className="text-sm"
      >
        <option value="">Semua Lembaga</option>
        {lembagas.map((lembaga) => (
          <option key={lembaga.id} value={lembaga.id}>
            {lembaga.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
