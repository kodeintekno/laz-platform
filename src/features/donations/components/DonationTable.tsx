"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { generateMockWebhookPayloadAction } from "@/features/donations/actions/donations.actions";
import { Button, Badge } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
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
        // 2. Actually POST it to our Webhook endpoint, exactly like Midtrans would
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

  const columns: ColumnDef<DonationWithRelations>[] = [
    {
      header: "Donatur",
      cell: (donation) => (
        <div>
          <div className="font-semibold text-text-primary">
            {donation.isAnonymous ? "Hamba Allah" : donation.user?.name || "Hamba Allah"}
            {donation.isAnonymous && donation.user && (
              <span className="ml-2 text-xs text-text-muted font-normal">(Asli: {donation.user.name})</span>
            )}
          </div>
          {donation.user?.email && <div className="text-text-secondary text-xs mt-0.5">{donation.user.email}</div>}
        </div>
      ),
    },
    {
      header: "Program",
      accessorKey: "program.title",
      width: "250px",
    },
    {
      header: "Nominal",
      cell: (donation) => (
        <div>
          <div className="font-semibold text-text-primary">
            {formatRupiah(donation.amount as any)}
          </div>
          {donation.payment?.paymentMethod && (
            <div className="text-xs text-text-secondary font-normal mt-0.5">
              {donation.payment.paymentMethod.replace("_", " ")}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (donation) => (
        <Badge
          intent={
            donation.status === "PAID"
              ? "success"
              : donation.status === "PENDING"
              ? "warning"
              : "destructive"
          }
        >
          {donation.status}
        </Badge>
      ),
    },
    {
      header: "Tanggal",
      cell: (donation) => formatDate(donation.createdAt),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (donation) =>
        donation.status === "PENDING" ? (
          <Button
            onClick={() => simulateWebhook(donation.id)}
            disabled={isPending}
            isLoading={simulatingId === donation.id}
            size="sm"
            intent="outline"
          >
            Simulate Webhook
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={donations}
      emptyTitle="Tidak ada data donasi ditemukan"
      emptyDescription="Belum ada transaksi donasi yang tercatat di platform."
    />
  );
}

