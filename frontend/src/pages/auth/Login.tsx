import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-2">Masuk ke Akun</h1>
      <p className="text-sm text-secondary mb-6">Masukkan email dan password Anda untuk melanjutkan.</p>
      <LoginForm />
    </>
  );
}
