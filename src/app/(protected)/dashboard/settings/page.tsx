import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Settings | LAZ Platform",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.SETTINGS_MANAGE)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Pengaturan Sistem</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Kelola konfigurasi platform, informasi LAZ, limit donasi, dan pengaturan integrasi pihak ketiga.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 mb-4">
          <Settings className="h-6 w-6 text-brand-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Fitur Pengaturan</h3>
        <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
          Halaman pengaturan sistem sedang dalam pengembangan. Semua opsi konfigurasi konfigurasi global akan dirilis di sini.
        </p>
      </div>
    </div>
  );
}
