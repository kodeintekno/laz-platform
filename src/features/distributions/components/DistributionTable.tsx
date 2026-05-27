"use client";

import { useTransition, useState } from "react";
import type { Prisma } from "@prisma/client";
import { approveDistributionAction, rejectDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { Button, Badge, ConfirmDialog } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { toast } from "@/stores/toast.store";
import { useRouter } from "next/navigation";

type DistributionWithRelations = Prisma.DistributionGetPayload<{
  include: {
    program: { select: { title: true; currentAmount: true; distributedAmount: true } };
    createdBy: { select: { name: true; email: true } };
    approvedBy: { select: { name: true } };
  };
}>;

export function DistributionTable({ distributions }: { distributions: DistributionWithRelations[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    intent: "primary" | "destructive";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    intent: "primary",
    onConfirm: () => {},
  });

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleApprove = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Setujui Penyaluran",
      message: "Setujui penyaluran dana ini? Dana program akan otomatis berkurang.",
      intent: "primary",
      onConfirm: () => {
        startTransition(async () => {
          const result = await approveDistributionAction(id);
          if (result.error) toast.error(result.error);
          else {
            toast.success("Penyaluran dana berhasil disetujui!");
            router.refresh();
          }
        });
      },
    });
  };

  const handleReject = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Tolak Penyaluran",
      message: "Tolak permintaan penyaluran dana ini?",
      intent: "destructive",
      onConfirm: () => {
        startTransition(async () => {
          const result = await rejectDistributionAction(id);
          if (result.error) toast.error(result.error);
          else {
            toast.success("Penyaluran dana ditolak!");
            router.refresh();
          }
        });
      },
    });
  };

  const columns: ColumnDef<DistributionWithRelations>[] = [
    {
      header: "Program",
      cell: (dist) => (
        <div>
          <div className="font-semibold text-primary truncate max-w-[200px]">{dist.program.title}</div>
          <div className="text-xs text-secondary mt-0.5">
            Saldo: {formatRupiah(Number(dist.program.currentAmount) - Number(dist.program.distributedAmount))}
          </div>
        </div>
      ),
    },
    {
      header: "Rincian Penyaluran",
      cell: (dist) => (
        <div className="max-w-[250px]">
          <div className="font-medium text-primary mb-1">{dist.title}</div>
          <div className="text-xs text-secondary line-clamp-2">{dist.description}</div>
        </div>
      ),
    },
    {
      header: "Nominal",
      cell: (dist) => (
        <span className="font-medium text-primary">{formatRupiah(dist.amount as any)}</span>
      ),
    },
    {
      header: "Pemohon",
      cell: (dist) => (
        <span className="text-secondary text-sm">{dist.createdBy.name}</span>
      ),
    },
    {
      header: "Status",
      cell: (dist) => (
        <div>
          <Badge
            intent={
              dist.status === "COMPLETED"
                ? "success"
                : dist.status === "PENDING"
                ? "warning"
                : "destructive"
            }
          >
            {dist.status}
          </Badge>
          {dist.approvedBy && (
            <div className="text-xs text-muted mt-1">Oleh: {dist.approvedBy.name}</div>
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (dist) =>
        dist.status === "PENDING" ? (
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => handleApprove(dist.id)}
              disabled={isPending}
              size="sm"
              intent="primary"
            >
              Setujui
            </Button>
            <Button
              onClick={() => handleReject(dist.id)}
              disabled={isPending}
              size="sm"
              intent="destructive"
            >
              Tolak
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={distributions}
        emptyTitle="Tidak ada data penyaluran ditemukan"
        emptyDescription="Daftar pengajuan penyaluran dana kosong."
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        intent={confirmState.intent}
        isLoading={isPending}
      />
    </>
  );
}
