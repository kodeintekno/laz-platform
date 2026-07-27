import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, ClipboardList, ListChecks, Award, Settings, LogOut, Menu, X } from "lucide-react";
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
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">
      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 lg:hidden transition-opacity duration-300 ease-in-out z-30",
          isNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsNavOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "w-64 bg-surface border-r border-border/40 flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out",
          isNavOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0",
        )}
        aria-label="Navigasi relawan"
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <p className="font-black text-lg text-emerald-700">Ruang<span className="text-emerald-500">Berbagi</span></p>
            <p className="text-xs text-secondary mt-1">Portal Relawan</p>
          </div>
          <button
            onClick={() => setIsNavOpen(false)}
            aria-label="Tutup navigasi"
            className="p-2 rounded-xl text-secondary hover:bg-surface-muted lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsNavOpen(false)}
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border/40 flex items-center px-4 shrink-0 lg:hidden">
          <button
            onClick={() => setIsNavOpen(true)}
            aria-label="Buka navigasi"
            className="p-2 rounded-xl text-secondary hover:bg-surface-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="ml-3 font-black text-emerald-700">Ruang<span className="text-emerald-500">Berbagi</span></p>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
