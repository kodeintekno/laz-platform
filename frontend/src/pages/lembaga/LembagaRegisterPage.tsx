import { LembagaRegistrationForm } from "@/features/lembaga/components/LembagaRegistrationForm";

export function LembagaRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-2xl bg-surface rounded-3xl shadow-xl border border-border/40 p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Daftarkan Lembaga Anda</h1>
        <p className="text-sm text-secondary mb-6">
          Lengkapi formulir berikut untuk mendaftarkan lembaga/yayasan Anda. Pendaftaran akan
          diverifikasi oleh tim kami sebelum Anda dapat mengelola dashboard lembaga.
        </p>
        <LembagaRegistrationForm />
      </div>
    </div>
  );
}
