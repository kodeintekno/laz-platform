"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "@/components/ui";
import { toast } from "@/stores/toast.store";
import { updateProfileAction } from "../actions/settings.actions";
import { updateProfileSchema } from "../validations/settings.schema";

interface ProfileCardProps {
  user: {
    name: string | null;
    email: string;
    phoneNumber: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const parsed = updateProfileSchema.safeParse({ name, phoneNumber });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Input tidak valid.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phoneNumber", phoneNumber.trim());

      const res = await updateProfileAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profil berhasil diperbarui!");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Pengguna</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary">Nama Lengkap</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Fauzi"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary">Alamat Email (Tidak Dapat Diubah)</label>
              <Input
                value={user.email}
                disabled
                className="bg-surface-muted text-secondary cursor-not-allowed opacity-80"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-primary">Nomor WhatsApp / Telepon</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                disabled={isPending}
              />
              <p className="text-xs text-secondary">
                Digunakan untuk mengirimkan pesan kuitansi dan update status penyaluran dana.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-surface-soft pt-4 mt-4">
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            Simpan Profil
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
