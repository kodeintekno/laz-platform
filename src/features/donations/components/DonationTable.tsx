"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { generateMockWebhookPayloadAction } from "@/features/donations/actions/donations.actions";
import { Button, Badge } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { useRouter } from "next/navigation";

type DonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    program: { select: { title: true } };
    payment: true;
  };
}>;

export function DonationTable({ donations }: { donations: DonationWithRelations[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

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

  const simulateWebhook = async (donationId: string) => {
    setSimulatingId(donationId);
    startTransition(async () => {
      // 1. Get the signed mock payload from the server action
      const result = await generateMockWebhookPayloadAction(donationId);
      
      if (result?.error) {
        toast.error("Gagal memuat payload: " + result.error);
        setSimulatingId(null);
        return;
      }

      if (result?.payload) {
        // 2. Actually POST it to our new Webhook endpoint, exactly like Midtrans would
        try {
          const response = await fetch("/api/webhooks/midtrans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(result.payload),
          });

          const data = await response.json();
          if (data.success) {
            toast.success("Webhook berhasil diproses!");
            router.refresh();
          } else {
            toast.error("Webhook gagal diproses: " + data.message);
          }
        } catch (error) {
          toast.error("Gagal mengirim webhook: " + String(error));
        }
      }
      setSimulatingId(null);
    });
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
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Aksi</span></th>
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
                <Badge intent={
                  donation.status === 'PAID' ? 'success' : 
                  donation.status === 'PENDING' ? 'warning' : 'destructive'
                }>
                  {donation.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {formatDate(donation.createdAt)}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {donation.status === "PENDING" && (
                  <Button
                    onClick={() => simulateWebhook(donation.id)}
                    disabled={isPending}
                    isLoading={simulatingId === donation.id}
                    size="sm"
                    intent="outline"
                  >
                    Simulate Webhook
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {donations.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                Tidak ada data donasi ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
