import { DonationHistoryLookup } from "@/features/donations/components/DonationHistoryLookup";

export function DonationHistoryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Riwayat Donasi</h1>
        <p className="mt-4 text-secondary">
          Masukkan nomor telepon yang Anda gunakan saat berdonasi untuk melihat seluruh riwayat donasi Anda —
          tanpa perlu login.
        </p>
      </div>

      <DonationHistoryLookup />
    </main>
  );
}
