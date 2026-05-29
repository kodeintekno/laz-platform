import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.SETTINGS_MANAGE)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Sistem"
        description="Kelola konfigurasi platform, informasi LAZ, limit donasi, dan pengaturan integrasi pihak ketiga."
      />

      <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 mb-4">
          <Settings className="h-6 w-6 text-brand-primary" />
        </div>
        <h3 className="text-sm font-semibold text-primary">Fitur Pengaturan</h3>
        <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
          Halaman pengaturan sistem sedang dalam pengembangan. Semua opsi konfigurasi konfigurasi global akan dirilis di sini.
        </p>
      </div>
    </div>
  );
}
