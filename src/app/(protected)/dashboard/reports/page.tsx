import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Reports | LAZ Platform",
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.permissions.includes(PERMISSIONS.REPORTS_READ)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-text-primary">Laporan Keuangan & Kinerja</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Lihat dan ekspor laporan pendistribusian zakat, statistik donasi, serta audit kepatuhan syariah.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 mb-4">
          <BarChart3 className="h-6 w-6 text-brand-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Fitur Laporan Analitik</h3>
        <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
          Halaman laporan analitik sedang dalam pengembangan. Laporan berkala akan ditampilkan dengan grafik interaktif di sini.
        </p>
      </div>
    </div>
  );
}
