"use client";

import { useTransition, useState } from "react";
import type { Prisma } from "@prisma/client";
import { approveDistributionAction, rejectDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { Button, Badge, ConfirmDialog } from "@/components/ui";
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

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Program</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rincian Penyaluran</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nominal</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pemohon</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {distributions.map((dist) => (
            <tr key={dist.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium text-gray-900 truncate max-w-[200px]">{dist.program.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">Saldo: {formatRupiah(Number(dist.program.currentAmount) - Number(dist.program.distributedAmount))}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 max-w-[250px]">
                <div className="font-medium text-gray-900 mb-1">{dist.title}</div>
                <div className="text-xs line-clamp-2">{dist.description}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                {formatRupiah(dist.amount as any)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {dist.createdBy.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <Badge intent={
                  dist.status === 'COMPLETED' ? 'success' : 
                  dist.status === 'PENDING' ? 'warning' : 'destructive'
                }>
                  {dist.status}
                </Badge>
                {dist.approvedBy && (
                  <div className="text-xs text-gray-400 mt-1">Oleh: {dist.approvedBy.name}</div>
                )}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                {dist.status === "PENDING" && (
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
                )}
              </td>
            </tr>
          ))}
          {distributions.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                Belum ada data penyaluran.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        intent={confirmState.intent}
        isLoading={isPending}
      />
    </div>
  );
}
