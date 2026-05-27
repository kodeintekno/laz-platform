import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft border border-border p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">LAZ Platform</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Masuk ke akun Anda
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

