import { VolunteerRegisterForm } from "@/features/volunteers/components/VolunteerRegisterForm";

export function VolunteerRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-lg bg-surface rounded-3xl shadow-xl border border-border/40 p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Daftar sebagai Relawan</h1>
        <p className="text-sm text-secondary mb-6">
          Bergabunglah sebagai relawan dan bantu program-program kebaikan di berbagai lembaga.
        </p>
        <VolunteerRegisterForm />
      </div>
    </div>
  );
}
