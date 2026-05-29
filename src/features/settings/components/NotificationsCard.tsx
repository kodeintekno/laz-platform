"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
} from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { updateNotificationsAction } from "../actions/settings.actions";
import { updateNotificationsSchema } from "../validations/settings.schema";

interface NotificationsCardProps {
  user: {
    emailNotifications: boolean;
    waNotifications: boolean;
  };
}

export function NotificationsCard({ user }: NotificationsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications);
  const [waNotifications, setWaNotifications] = useState(user.waNotifications);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const parsed = updateNotificationsSchema.safeParse({
      emailNotifications,
      waNotifications,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Input tidak valid.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("emailNotifications", emailNotifications ? "true" : "false");
      formData.append("waNotifications", waNotifications ? "true" : "false");

      const res = await updateNotificationsAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Preferensi notifikasi berhasil diperbarui!");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Notifikasi</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-2 hover:bg-surface-muted rounded-xl transition cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailNotifications}
                disabled={isPending}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-5 w-5 mt-0.5 rounded border border-secondary/40 accent-brand-primary cursor-pointer transition flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary leading-tight">Notifikasi Email</div>
                <div className="text-xs text-secondary mt-1">
                  Kirimkan bukti donasi, laporan keuangan tahunan, dan risalah laporan resmi program lewat email.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 hover:bg-surface-muted rounded-xl transition cursor-pointer select-none">
              <input
                type="checkbox"
                checked={waNotifications}
                disabled={isPending}
                onChange={(e) => setWaNotifications(e.target.checked)}
                className="h-5 w-5 mt-0.5 rounded border border-secondary/40 accent-brand-primary cursor-pointer transition flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary leading-tight">Notifikasi WhatsApp</div>
                <div className="text-xs text-secondary mt-1">
                  Kirimkan bukti transaksi instan, kuitansi digital, dan pemberitahuan penyaluran dana langsung ke nomor WhatsApp Anda.
                </div>
              </div>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-surface-soft pt-4 mt-4">
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            Simpan Notifikasi
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
