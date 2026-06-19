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
import { changePasswordAction } from "../actions/settings.actions";
import { changePasswordSchema } from "../validations/settings.schema";

export function SecurityCard() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Input tidak valid.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePasswordAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Kata sandi berhasil diubah!");
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan Akun</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary">Kata Sandi Saat Ini</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary">Kata Sandi Baru</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary">Konfirmasi Kata Sandi Baru</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isPending}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-surface-soft pt-4 mt-4">
          <Button type="submit" isLoading={isPending} disabled={isPending}>
            Ubah Kata Sandi
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
