import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-black text-brand-primary">
            LAZ Platform
          </a>
        </div>
        <div className="bg-surface rounded-2xl shadow-soft border border-border/40 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
