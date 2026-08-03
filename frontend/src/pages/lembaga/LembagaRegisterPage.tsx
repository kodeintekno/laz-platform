import { LembagaRegistrationForm } from "@/features/lembaga/components/LembagaRegistrationForm";

export function LembagaRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-3xl bg-surface rounded-3xl shadow-xl border border-border/40 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Daftarkan Lembaga Anda</h1>
          <p className="text-sm text-secondary mt-1">
            Lengkapi formulir berikut untuk mendaftarkan lembaga/yayasan Anda. Pendaftaran akan
            diverifikasi oleh tim kami sebelum Anda dapat mengelola dashboard lembaga.
          </p>
        </div>
        <LembagaRegistrationForm />
      </div>
    </div>
  );
}
