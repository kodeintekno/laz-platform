"use client";

import type { Prisma } from "@prisma/client";

type DonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    program: { select: { title: true } };
    payment: true;
  };
}>;

export function DonationTable({ donations }: { donations: DonationWithRelations[] }) {
  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Donatur</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Program</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nominal</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {donations.map((donation) => (
            <tr key={donation.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium text-gray-900">
                  {donation.isAnonymous ? "Hamba Allah" : donation.user?.name || "Hamba Allah"}
                  {donation.isAnonymous && donation.user && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">(Asli: {donation.user.name})</span>
                  )}
                </div>
                {donation.user?.email && <div className="text-gray-500 text-xs mt-0.5">{donation.user.email}</div>}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                {donation.program.title}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                {formatRupiah(donation.amount as any)}
                {donation.payment?.paymentMethod && (
                  <div className="text-xs text-gray-500 font-normal mt-0.5">{donation.payment.paymentMethod.replace('_', ' ')}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  donation.status === 'PAID' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                  donation.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                  'bg-red-50 text-red-700 ring-red-600/20'
                }`}>
                  {donation.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatDate(donation.createdAt)}
              </td>
            </tr>
          ))}
          {donations.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                Tidak ada data donasi ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
