import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-2">Buat Akun Baru</h1>
      <p className="text-sm text-secondary mb-6">Daftarkan diri Anda untuk mulai berdonasi.</p>
      <RegisterForm />
    </>
  );
}
