/**
 * Dashboard Home Page — Phase 1 Shell.
 *
 * Empty placeholder. Statistics and widgets added in Dashboard Phase.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">
        Welcome to LAZ Platform. More content coming soon.
      </p>

      {/* Stats grid placeholder */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
