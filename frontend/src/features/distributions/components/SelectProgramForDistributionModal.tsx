import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface SelectProgramForDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function SelectProgramForDistributionModal({
  isOpen,
  onClose,
}: SelectProgramForDistributionModalProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: result, isLoading } = useQuery({
    queryKey: ["programs", "for-distribution", { status: "PUBLISHED" }],
    queryFn: () => api.get<any[]>("/programs", { status: "PUBLISHED", limit: 100 }),
    enabled: isOpen,
  });

  const programs = (result?.data ?? []).map((p: any) => ({
    ...p,
    currentAmount: Number(p.currentAmount),
    distributedAmount: Number(p.distributedAmount),
    availableBalance: Number(p.currentAmount) - Number(p.distributedAmount),
  }));

  const filtered = programs.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (program: (typeof programs)[0]) => {
    onClose();
    navigate(`/dashboard/programs/${program.slug}/distributions/new`);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Program untuk Penyaluran Dana"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-surface-muted text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Program List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-secondary text-sm">
              {search ? "Tidak ada program yang cocok" : "Tidak ada program published"}
            </div>
          ) : (
            filtered.map((program) => {
              const isEmpty = program.availableBalance <= 0;
              const isLow = program.availableBalance < 500_000 && !isEmpty;

              return (
                <button
                  key={program.id}
                  onClick={() => handleSelect(program)}
                  disabled={isEmpty}
                  className="w-full text-left p-4 rounded-xl border border-border bg-surface hover:bg-surface-muted hover:border-primary/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: icon + info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center mt-0.5">
                        <svg
                          className="w-4 h-4 text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 7a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2A2 2 0 0 0 13.07 8H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate group-hover:text-brand-primary transition-colors">
                          {program.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">
                          {program.lembaga?.name ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Right: balance badge */}
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isEmpty
                            ? "bg-red-50 text-red-600"
                            : isLow
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEmpty
                              ? "bg-red-500"
                              : isLow
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        {isEmpty
                          ? "Saldo Habis"
                          : formatRupiah(program.availableBalance)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border flex justify-end">
          <Button intent="secondary" size="sm" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
