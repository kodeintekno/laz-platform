import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api-client";
import { ProgramCard, EmptyState, Pagination } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const CATEGORIES = [
  { value: "", label: "Semua Kategori" },
  { value: "ZAKAT", label: "Zakat" },
  { value: "INFAK", label: "Infak" },
  { value: "SEDEKAH", label: "Sedekah" },
  { value: "WAKAF", label: "Wakaf" },
];

export function ProgramsPage() {
  const now = Date.now();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const page = Number(searchParams.get("page") ?? 1);
  const limit = 12;
  const category = searchParams.get("category") ?? "";
  const lembagaSlug = searchParams.get("lembagaSlug") ?? "";
  const sort = (searchParams.get("sort") as "newest" | "most-funded" | "ending-soon") ?? "newest";

  const { data: lembagaResult } = useQuery({
    queryKey: ["public", "lembaga", "options"],
    queryFn: () => api.get<any[]>("/public/lembaga", { limit: 50 }),
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["public", "programs", { page, limit, search: searchParams.get("search"), category, lembagaSlug, sort }],
    queryFn: () =>
      api.get<any[]>("/public/programs", {
        page,
        limit,
        search: searchParams.get("search") || undefined,
        category: category || undefined,
        lembagaSlug: lembagaSlug || undefined,
        sort,
      }),
  });

  const programs = result?.data ?? [];
  const pagination = result?.meta
    ? { currentPage: result.meta.page, totalPages: result.meta.totalPages, totalCount: result.meta.total, pageSize: result.meta.limit }
    : { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", search.trim());
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Pilih Program Kebaikanmu
        </h1>
        <p className="mt-4 text-lg text-secondary">
          Salurkan zakat, infak, dan sedekah Anda kepada yang membutuhkan.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-10">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari program..."
            className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </form>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="appearance-none w-full lg:w-auto bg-surface border border-border/60 rounded-xl pl-4 pr-10 py-3 text-sm cursor-pointer focus:ring-2 focus:ring-brand-primary outline-none min-w-45"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
        </div>

        <div className="relative">
          <select
            value={lembagaSlug}
            onChange={(e) => updateParam("lembagaSlug", e.target.value)}
            className="appearance-none w-full lg:w-auto bg-surface border border-border/60 rounded-xl pl-4 pr-10 py-3 text-sm cursor-pointer focus:ring-2 focus:ring-brand-primary outline-none min-w-45"
          >
            <option value="">Semua Lembaga</option>
            {(lembagaResult?.data ?? []).map((l: any) => (
              <option key={l.id} value={l.slug}>{l.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="appearance-none w-full lg:w-auto bg-surface border border-border/60 rounded-xl pl-4 pr-10 py-3 text-sm cursor-pointer focus:ring-2 focus:ring-brand-primary outline-none min-w-45"
          >
            <option value="newest">Terbaru</option>
            <option value="most-funded">Dana Terbanyak</option>
            <option value="ending-soon">Segera Berakhir</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : programs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8 mb-12">
            {programs.map((program: any) => (
              <ProgramCard key={program.id} program={program} now={now} />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
            />
          )}
        </>
      ) : (
        <div className="max-w-md mx-auto py-8">
          <EmptyState
            title="Tidak Ada Program Ditemukan"
            description="Tidak ada program yang cocok dengan pencarian atau filter Anda."
          />
        </div>
      )}
    </main>
  );
}
