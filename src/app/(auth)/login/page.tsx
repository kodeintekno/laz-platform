/**
 * Login Page — Phase 1 Shell.
 *
 * Empty placeholder. Full auth form implemented in Auth Phase.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">LAZ Platform</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        {/* Form placeholder — implemented in Auth Phase */}
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
          <div className="h-10 bg-indigo-100 rounded-md animate-pulse" />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Auth form — coming in Phase 2
        </p>
      </div>
    </div>
  );
}
