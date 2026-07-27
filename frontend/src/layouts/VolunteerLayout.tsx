import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, ClipboardList, ListChecks, Award, Settings, LogOut } from "lucide-react";
import { useVolunteerAuth } from "@/auth/VolunteerAuthProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/volunteer/dashboard", icon: LayoutDashboard },
  { label: "Cari Kegiatan", href: "/volunteer/activities", icon: Search },
  { label: "Pendaftaran Saya", href: "/volunteer/applications", icon: ClipboardList },
  { label: "Kegiatan Saya", href: "/volunteer/my-activities", icon: ListChecks },
  { label: "Riwayat & Kontribusi", href: "/volunteer/history", icon: Award },
  { label: "Setting", href: "/volunteer/profile", icon: Settings },
];

export function VolunteerLayout() {
  const { volunteer, logout } = useVolunteerAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">
      <aside className="w-64 bg-surface border-r border-border/40 flex flex-col shrink-0">
        <div className="p-6 border-b border-border/40">
          <p className="font-black text-lg text-emerald-700">Ruang<span className="text-emerald-500">Berbagi</span></p>
          <p className="text-xs text-secondary mt-1">Portal Relawan</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition",
                  active ? "bg-brand-primary/10 text-brand-primary" : "text-secondary hover:bg-surface-muted",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/40">
          <div className="mb-3">
            <p className="text-sm font-bold text-primary">{volunteer?.name}</p>
            <p className="text-xs text-secondary">{volunteer?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-sm font-semibold text-destructive hover:underline"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
