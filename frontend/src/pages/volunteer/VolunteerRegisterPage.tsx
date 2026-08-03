import { VolunteerRegisterForm } from "@/features/volunteers/components/VolunteerRegisterForm";

export function VolunteerRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-xl bg-surface rounded-3xl shadow-xl border border-border/40 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Daftar sebagai Relawan</h1>
          <p className="text-sm text-secondary mt-1">
            Bergabunglah sebagai relawan dan bantu program-program kebaikan di berbagai lembaga.
          </p>
        </div>
        <VolunteerRegisterForm />
      </div>
    </div>
  );
}
