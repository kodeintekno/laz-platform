"use client";

import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";

type ProgramWithCreator = Prisma.ProgramGetPayload<{
  include: { createdBy: { select: { name: true } } };
}>;

export function ProgramTable({ programs }: { programs: ProgramWithCreator[] }) {
  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  if (programs.length === 0) {
    return (
      <EmptyState
        title="Tidak ada program ditemukan"
        description="Daftar program kampanye zakat, infak, atau sedekah kosong."
      />
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Judul Program</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Kategori</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Terkumpul</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {programs.map((program) => (
            <tr key={program.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium text-gray-900 truncate max-w-[250px]">{program.title}</div>
                <div className="text-gray-500 text-xs mt-1">oleh {program.createdBy.name}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <Badge intent="info">
                  {program.category}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="font-medium text-gray-900">{formatRupiah(program.currentAmount as any)}</div>
                <div className="text-xs text-gray-400">dari {formatRupiah(program.targetAmount as any)}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <Badge intent={
                  program.status === "PUBLISHED" ? "success" : 
                  program.status === "COMPLETED" ? "muted" : "warning"
                }>
                  {program.status}
                </Badge>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                <Link href={`/programs/${program.slug}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                  Lihat
                </Link>
                <Link href={`/dashboard/programs/${program.slug}/distributions/new`} className="text-emerald-600 hover:text-emerald-900 font-semibold">
                  Ajukan Penyaluran
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

