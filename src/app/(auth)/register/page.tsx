import { RegisterForm } from "@/features/auth/components/RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border/40 p-6 shadow-soft">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image src="/icon.png" alt="LAZ Platform Logo" width={48} height={48} className="w-12 h-12 object-contain mb-3" />
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

