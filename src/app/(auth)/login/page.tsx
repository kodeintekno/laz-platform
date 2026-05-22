import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">LAZ Platform</h1>
          <p className="mt-2 text-sm text-gray-500">
            Masuk ke akun Anda
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

