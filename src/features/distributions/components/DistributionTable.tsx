"use client";

import { useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { approveDistributionAction, rejectDistributionAction } from "@/features/distributions/actions/distributions.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleApprove = (id: string) => {
    if (!confirm("Setujui penyaluran dana ini? Dana program akan otomatis berkurang.")) return;
    startTransition(async () => {
      const result = await approveDistributionAction(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  };

  const handleReject = (id: string) => {
    if (!confirm("Tolak permintaan penyaluran dana ini?")) return;
    startTransition(async () => {
      const result = await rejectDistributionAction(id);
      if (result.error) alert(result.error);
      else router.refresh();
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
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  dist.status === 'COMPLETED' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                  dist.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                  'bg-red-50 text-red-700 ring-red-600/20'
                }`}>
                  {dist.status}
                </span>
                {dist.approvedBy && (
                  <div className="text-xs text-gray-400 mt-1">Oleh: {dist.approvedBy.name}</div>
                )}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                {dist.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(dist.id)}
                      disabled={isPending}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReject(dist.id)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </>
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
    </div>
  );
}
