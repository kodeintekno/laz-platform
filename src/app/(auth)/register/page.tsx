import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-surface-soft rounded-md border border-border/20 p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">Buat Akun</h1>
          <p className="mt-2 text-sm text-secondary">
            Daftar sebagai donatur
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}

