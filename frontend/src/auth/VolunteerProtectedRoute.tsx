import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";
import { LoadingSpinner } from "@/components/ui";

/** Guard route login relawan — paralel dengan ProtectedRoute (staff). */
export function VolunteerProtectedRoute({ children }: { children: ReactNode }) {
  const { volunteer, isLoading } = useVolunteerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!volunteer) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
