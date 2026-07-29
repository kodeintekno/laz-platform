import React from "react";
import { Badge, ActionDropdown } from "@/components/ui";
import type { ColumnDef } from "@/components/ui/data-table";
import type { Lembaga } from "@prisma/client";
import { Pencil, Trash2, CheckCircle2, XCircle, Eye } from "lucide-react";

interface GetLembagaColumnsProps {
  onEdit: (lembaga: Lembaga) => void;
  onDelete: (lembaga: Lembaga) => void;
  onView?: (lembaga: Lembaga) => void;
  onApprove?: (lembaga: Lembaga) => void;
  onReject?: (lembaga: Lembaga) => void;
}

const STATUS_META: Record<string, { label: string; intent: "success" | "warning" | "destructive" }> = {
  PENDING: { label: "Menunggu Persetujuan", intent: "warning" },
  APPROVED: { label: "Disetujui", intent: "success" },
  REJECTED: { label: "Ditolak", intent: "destructive" },
};

export function getLembagaColumns({
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
}: GetLembagaColumnsProps): ColumnDef<Lembaga>[] {
  return [
    {
      header: "Logo",
      cell: (lembaga) => (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-soft text-secondary font-bold text-sm border border-surface-soft overflow-hidden">
          {lembaga.logoUrl ? (
            <img src={lembaga.logoUrl} alt={lembaga.name} className="w-full h-full object-cover" />
          ) : (
            lembaga.name.slice(0, 2).toUpperCase()
          )}
        </div>
      ),
    },
    {
      header: "Nama Lembaga",
      accessorKey: "name",
      cell: (lembaga) => (
        <div>
          <span className="font-semibold text-primary block">{lembaga.name}</span>
          <span className="text-xs text-secondary">{lembaga.picName}</span>
        </div>
      ),
    },
    {
      header: "Slug",
      accessorKey: "slug",
      cell: (lembaga) => <span className="text-secondary font-mono text-xs">{lembaga.slug}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (lembaga) => {
        const meta = STATUS_META[lembaga.status] ?? { label: lembaga.status, intent: "warning" as const };
        return <Badge intent={meta.intent}>{meta.label}</Badge>;
      },
    },
    {
      header: "Tanggal Terdaftar",
      accessorKey: "createdAt",
      cell: (lembaga) => {
        return new Date(lembaga.createdAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    },
    {
      header: "Aksi",
      align: "right",
      cell: (lembaga) => (
        <ActionDropdown
          items={[
            ...(lembaga.status === "PENDING" && onView
              ? [{ label: "Lihat Detail & Verifikasi", icon: Eye, onClick: () => onView(lembaga), intent: "info" as const }]
              : []),
            ...(lembaga.status === "PENDING" && onApprove
              ? [{ label: "Setujui", icon: CheckCircle2, onClick: () => onApprove(lembaga), intent: "success" as const }]
              : []),
            ...(lembaga.status === "PENDING" && onReject
              ? [{ label: "Tolak", icon: XCircle, onClick: () => onReject(lembaga), intent: "destructive" as const }]
              : []),
            {
              label: "Ubah",
              icon: Pencil,
              onClick: () => onEdit(lembaga),
              intent: "info",
            },
            {
              label: "Hapus",
              icon: Trash2,
              onClick: () => onDelete(lembaga),
              intent: "destructive",
            },
          ]}
        />
      ),
    },
  ];
}
