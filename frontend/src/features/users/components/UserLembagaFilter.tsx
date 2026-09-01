import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui";

interface UserLembagaFilterProps {
  lembagas: { id: string; name: string }[];
  includePlatform?: boolean;
}

export function UserLembagaFilter({ lembagas, includePlatform = false }: UserLembagaFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectedLembagaId = searchParams?.get("scope") === "platform"
    ? "__platform"
    : searchParams?.get("lembagaId") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");

    if (val === "__platform") {
      params.delete("lembagaId");
      params.set("scope", "platform");
    } else if (val) {
      params.delete("scope");
      params.set("lembagaId", val);
    } else {
      params.delete("scope");
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
        {includePlatform && <option value="__platform">Buku Platform</option>}
        {lembagas.map((lembaga) => (
          <option key={lembaga.id} value={lembaga.id}>
            {lembaga.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
