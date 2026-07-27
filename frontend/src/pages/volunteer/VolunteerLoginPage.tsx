import { VolunteerLoginForm } from "@/features/volunteers/components/VolunteerLoginForm";

export function VolunteerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl border border-border/40 p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Masuk sebagai Relawan</h1>
        <p className="text-sm text-secondary mb-6">Masukkan email dan password akun relawan Anda.</p>
        <VolunteerLoginForm />
      </div>
    </div>
  );
}
