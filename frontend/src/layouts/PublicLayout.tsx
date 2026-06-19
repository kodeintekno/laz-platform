import { Outlet } from "react-router-dom";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { useAuth } from "@/auth/AuthProvider";

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="bg-surface min-h-screen flex flex-col justify-between">
      <div>
        <PublicHeader user={user ?? undefined} />
        <Outlet />
      </div>
      <PublicFooter />
    </div>
  );
}
